# Animation Mapping: CSS → React Native Reanimated 3

The HTML prototype defines 7 named animations in `cr-animations.css`. Each must be replicated in Reanimated 3.

---

## 1. `cr-pop` — Orb placement bounce

**Trigger**: When an orb is added to a cell (`justAdded` flag).  
**Duration**: 240ms  
**Easing**: Spring (overshoot)

```css
@keyframes cr-pop {
  0%   { transform: scale(0.5); opacity: 0.4; }
  55%  { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

**Reanimated equivalent**:
```typescript
const scale = useSharedValue(0);
const opacity = useSharedValue(0);

function triggerPop() {
  scale.value = withSpring(1, {
    damping: 8,
    stiffness: 200,
    mass: 0.8,
  });
  opacity.value = withTiming(1, { duration: 120 });
}

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }],
  opacity: opacity.value,
}));
```

---

## 2. `cr-wobble` — Pre-critical cell warning

**Trigger**: When a cell is one orb away from exploding (`criticalSoon` flag).  
**Duration**: 550ms loop, infinite  

```css
@keyframes cr-wobble {
  0%, 100% { transform: rotate(0deg) scale(1); }
  20%      { transform: rotate(-3deg) scale(1.04); }
  40%      { transform: rotate(2deg)  scale(0.97); }
  60%      { transform: rotate(-2deg) scale(1.04); }
  80%      { transform: rotate(3deg)  scale(0.98); }
}
```

**Reanimated equivalent**:
```typescript
const rotation = useSharedValue(0);
const scale = useSharedValue(1);

function startWobble() {
  rotation.value = withRepeat(
    withSequence(
      withTiming(-3, { duration: 110 }),
      withTiming(2,  { duration: 110 }),
      withTiming(-2, { duration: 110 }),
      withTiming(3,  { duration: 110 }),
      withTiming(0,  { duration: 110 }),
    ),
    -1, // infinite
    false
  );
}

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { rotate: `${rotation.value}deg` },
    { scale: scale.value },
  ],
}));
```

---

## 3. `cr-atom-orbit` — Idle orb float

**Trigger**: Always active on orbs inside a cell.  
**Duration**: 1.6s loop, infinite  

```css
@keyframes cr-atom-orbit {
  0%   { translate: 0 0; }
  50%  { translate: 0 -2px; }
  100% { translate: 0 0; }
}
```

**Reanimated equivalent**:
```typescript
const translateY = useSharedValue(0);

useEffect(() => {
  translateY.value = withRepeat(
    withSequence(
      withTiming(-2, { duration: 800, easing: Easing.inOut(Easing.sine) }),
      withTiming(0,  { duration: 800, easing: Easing.inOut(Easing.sine) }),
    ),
    -1,
    false
  );
}, []);
```

---

## 4. `cr-explode-flash` — Cell flash on explosion

**Trigger**: When a cell explodes.  
**Duration**: 200ms, once  

```css
@keyframes cr-explode-flash {
  0%   { transform: scale(0.4); opacity: 0; }
  30%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}
```

**Reanimated equivalent**:
```typescript
function triggerExplodeFlash(scale: SharedValue<number>, opacity: SharedValue<number>) {
  scale.value = 0.4;
  opacity.value = 0;
  scale.value = withTiming(1.4, { duration: 200, easing: Easing.out(Easing.ease) });
  opacity.value = withSequence(
    withTiming(1, { duration: 60 }),
    withTiming(0, { duration: 140 }),
  );
}
```

---

## 5. `cr-travel` — Orb traveling between cells

**Trigger**: During explosion, orbs fly from exploded cell to each neighbor.  
**Duration**: 220ms (scaled by `speed` tweak)  
**Easing**: `cubic-bezier(.55,.05,.5,1)`  

```css
@keyframes cr-travel {
  0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.7; }
  20%  { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
  100% {
    transform: translate(calc(-50% + var(--cr-tx)), calc(-50% + var(--cr-ty))) scale(0.8);
    opacity: 1;
  }
}
```

**Reanimated equivalent** (absolutely-positioned overlay orb):
```typescript
// from: { c, r } cell coords of exploding cell
// to:   { c, r } cell coords of target neighbor
// cellSize: pixel size of each cell

function animateTraveler(
  translateX: SharedValue<number>,
  translateY: SharedValue<number>,
  scale: SharedValue<number>,
  opacity: SharedValue<number>,
  dx: number,  // (to.c - from.c) * cellSize
  dy: number,  // (to.r - from.r) * cellSize
  duration: number = 220
) {
  translateX.value = 0;
  translateY.value = 0;
  scale.value = 0.6;
  opacity.value = 0.7;

  translateX.value = withTiming(dx, { duration, easing: Easing.bezier(0.55, 0.05, 0.5, 1) });
  translateY.value = withTiming(dy, { duration, easing: Easing.bezier(0.55, 0.05, 0.5, 1) });
  scale.value = withSequence(
    withTiming(1.1, { duration: duration * 0.2 }),
    withTiming(0.8, { duration: duration * 0.8 }),
  );
  opacity.value = withSequence(
    withTiming(1, { duration: duration * 0.2 }),
    withDelay(duration * 0.6, withTiming(0, { duration: duration * 0.2 })),
  );
}
```

---

## 6. `cr-particle` — Scatter particles on explosion

**Trigger**: During explosion, 6–8 small dots scatter outward.  
**Duration**: 480ms, once  

```css
@keyframes cr-particle {
  0%   { transform: translate(0, 0) scale(1);   opacity: 1; }
  100% { transform: translate(var(--cr-px), var(--cr-py)) scale(0); opacity: 0; }
}
/* --cr-px, --cr-py set per-particle to random directions */
```

**Reanimated equivalent** (render 6–8 particles, each with random angle):
```typescript
const PARTICLE_COUNT = 8;
const PARTICLE_DISTANCE = 40; // px

function createParticleAnimation(index: number, color: string) {
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const tx = Math.cos(angle) * PARTICLE_DISTANCE;
  const ty = Math.sin(angle) * PARTICLE_DISTANCE;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  function fire() {
    opacity.value = 1;
    translateX.value = withTiming(tx, { duration: 480, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(ty, { duration: 480, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(0, { duration: 480 });
    opacity.value = withTiming(0, { duration: 480 });
  }

  return { translateX, translateY, scale, opacity, fire };
}
```

---

## 7. `cr-celebrate` — Win screen confetti

**Trigger**: Win screen shown.  
**Duration**: 1.6s loop, infinite, staggered per particle  

```css
@keyframes cr-celebrate {
  0%   { transform: rotate(var(--cr-angle)) translateY(0) scale(0); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: rotate(var(--cr-angle)) translateY(-180px) scale(1); opacity: 0; }
}
```

**Reanimated equivalent**:
```typescript
function useCelebrateAnimation(angle: number, delay: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -180]);
    const scale = interpolate(progress.value, [0, 0.1, 1], [0, 1, 1]);
    const opacity = interpolate(progress.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    return {
      transform: [
        { rotate: `${angle}deg` },
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  return animatedStyle;
}
```

---

## Animation Timing Summary

| Event | Duration | Notes |
|---|---|---|
| Orb placement (pop) | 240ms | Spring, overshoot |
| Pre-critical wobble | 550ms | Infinite loop |
| Idle orb float | 1600ms | Infinite loop |
| Explosion flash | 200ms | Once |
| Orb travel | 220ms | Multiply by `speed` setting |
| Particles scatter | 480ms | 8 particles, fan out |
| Chain delay | 150ms | Between explosion waves |
| Win confetti | 1600ms | Infinite, staggered |

## Chain Reaction Sequencing

The engine returns `steps: ExplosionStep[]`. Each step = one wave of simultaneous explosions. In the UI, sequence them with a 150ms delay between waves:

```typescript
async function playExplosionSequence(steps: ExplosionStep[]) {
  for (const step of steps) {
    // Trigger travel animations for all orbs in this wave
    triggerTravelers(step.explode);
    // Wait for travel + a bit
    await delay(220 + 150);
    // Update board display to step.after
    updateBoard(step.after);
  }
}
```
