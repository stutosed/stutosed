import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  LayoutChangeEvent,
  PanResponder,
} from 'react-native';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BlurView } from 'expo-blur';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../theme/spacing';

interface LiquidGlassVideoPlayerProps {
  sourceUrl: string;
  title: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onPlaybackError?: () => void;
}

const SPEED_STEPS = [1, 1.25, 1.5, 1.75, 2, 0.75];

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const total = Math.floor(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const LiquidGlassVideoPlayer: React.FC<LiquidGlassVideoPlayerProps> = ({
  sourceUrl,
  title,
  isFullscreen,
  onToggleFullscreen,
  onPlaybackError,
}) => {
  const { colors } = useTheme();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const trackWidthRef = useRef(1);
  const durationRef = useRef(0);
  durationRef.current = duration;

  const [skipSide, setSkipSide] = useState<'left' | 'right' | null>(null);
  const [accumulatedSkip, setAccumulatedSkip] = useState(0);

  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const skipScale = useRef(new Animated.Value(0.85)).current;
  const skipOpacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | 'center' }>({
    time: 0,
    side: 'center',
  });
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const player = useVideoPlayer(sourceUrl, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
    p.preservesPitch = true;
    p.play();
  });

  useEventListener(player, 'playingChange', ({ isPlaying: nextPlaying }) => {
    setIsPlaying(nextPlaying);
  });

  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'loading') {
      setIsBuffering(true);
    } else if (status === 'readyToPlay') {
      setIsBuffering(false);
      if (player.duration > 0) setDuration(player.duration);
    } else if (status === 'error') {
      setIsBuffering(false);
      if (error && onPlaybackError) {
        onPlaybackError();
      }
    }
  });

  useEventListener(player, 'timeUpdate', (payload) => {
    setCurrentTime(payload.currentTime);
    setBufferedTime(payload.bufferedPosition);
    if (player.duration > 0) {
      setDuration(player.duration);
    }
  });

  useEffect(() => {
    Animated.timing(controlsOpacity, {
      toValue: controlsVisible ? 1 : 0,
      duration: 210,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, controlsOpacity]);

  const scheduleHideControls = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3400);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (controlsVisible) {
      scheduleHideControls();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [controlsVisible, isPlaying, scheduleHideControls]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
      if (skipClearTimerRef.current) clearTimeout(skipClearTimerRef.current);
    };
  }, []);

  const triggerSkip = useCallback(
    (delta: number) => {
      const target = Math.max(
        0,
        Math.min(duration > 0 ? duration : Number.MAX_SAFE_INTEGER, player.currentTime + delta)
      );
      player.currentTime = target;
      setCurrentTime(target);

      const side: 'left' | 'right' = delta < 0 ? 'left' : 'right';
      setSkipSide(side);
      setAccumulatedSkip((prev) => {
        if (prev !== 0 && Math.sign(prev) === Math.sign(delta)) {
          return prev + delta;
        }
        return delta;
      });

      skipScale.setValue(0.84);
      skipOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(skipScale, {
          toValue: 1,
          damping: 16,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(skipOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();

      if (skipClearTimerRef.current) clearTimeout(skipClearTimerRef.current);
      skipClearTimerRef.current = setTimeout(() => {
        Animated.timing(skipOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(() => {
          setSkipSide(null);
          setAccumulatedSkip(0);
        });
      }, 650);
    },
    [duration, player, skipOpacity, skipScale]
  );

  const handleZoneTap = (side: 'left' | 'right' | 'center') => {
    const now = Date.now();
    const prev = lastTapRef.current;

    if (side !== 'center' && prev.side === side && now - prev.time < 300) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = { time: now, side };
      triggerSkip(side === 'left' ? -10 : 10);
      return;
    }

    lastTapRef.current = { time: now, side };
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
    singleTapTimerRef.current = setTimeout(() => {
      setControlsVisible((v) => !v);
    }, side === 'center' ? 0 : 250);
  };

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
    setControlsVisible(true);
    scheduleHideControls();
  };

  const cycleSpeed = () => {
    const nextIdx = (speedIndex + 1) % SPEED_STEPS.length;
    setSpeedIndex(nextIdx);
    player.playbackRate = SPEED_STEPS[nextIdx];
    setControlsVisible(true);
    scheduleHideControls();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    player.muted = next;
    setControlsVisible(true);
    scheduleHideControls();
  };

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) {
      trackWidthRef.current = w;
    }
  };

  const seekToX = useCallback(
    (x: number) => {
      const dur = durationRef.current;
      const w = trackWidthRef.current;
      if (dur <= 0 || w <= 0) return;
      const ratio = Math.max(0, Math.min(1, x / w));
      const target = ratio * dur;
      player.currentTime = target;
      setCurrentTime(target);
    },
    [player]
  );

  const seekPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        seekToX(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        seekToX(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        scheduleHideControls();
      },
    })
  ).current;

  const playedPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPct = duration > 0 ? Math.min(100, (bufferedTime / duration) * 100) : 0;

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
        surfaceType="textureView"
        allowsPictureInPicture
      />

      {/* Tap Gesture Layer: Left (-10s double tap), Center (toggle controls), Right (+10s double tap) */}
      <View style={styles.gestureLayer} pointerEvents="box-none">
        <Pressable style={styles.sideZone} onPress={() => handleZoneTap('left')} />
        <Pressable style={styles.centerZone} onPress={() => handleZoneTap('center')} />
        <Pressable style={styles.sideZone} onPress={() => handleZoneTap('right')} />
      </View>

      {/* Liquid Glass Double-Tap Skip Feedback Pill */}
      {skipSide && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.skipPillWrap,
            skipSide === 'left' ? styles.skipLeft : styles.skipRight,
            { opacity: skipOpacity, transform: [{ scale: skipScale }] },
          ]}
        >
          <BlurView
            intensity={55}
            tint="dark"
            blurMethod="dimezisBlurViewSdk31Plus"
            style={styles.skipBlurPill}
          >
            <Text style={styles.skipArrows}>{skipSide === 'left' ? '««' : '»»'}</Text>
            <Text style={styles.skipLabel}>{Math.abs(accumulatedSkip)}s</Text>
          </BlurView>
        </Animated.View>
      )}

      {/* Liquid Glass Controls Overlay */}
      <Animated.View
        pointerEvents={controlsVisible ? 'box-none' : 'none'}
        style={[styles.controlsOverlay, { opacity: controlsOpacity }]}
      >
        {/* Top Floating Glass Title Chip (shown in fullscreen) */}
        {isFullscreen ? (
          <View style={styles.topGlassRow} pointerEvents="box-none">
            <BlurView
              intensity={45}
              tint="dark"
              blurMethod="dimezisBlurViewSdk31Plus"
              style={styles.titleGlassPill}
            >
              <Text style={styles.titleGlassText} numberOfLines={1}>
                {title}
              </Text>
            </BlurView>
          </View>
        ) : (
          <View />
        )}

        {/* Center Liquid Glass Controls: -10s | Play/Pause Orb | +10s */}
        <View style={styles.centerRow} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.sideSkipBtn}
            onPress={() => triggerSkip(-10)}
            activeOpacity={0.75}
          >
            <BlurView
              intensity={42}
              tint="dark"
              blurMethod="dimezisBlurViewSdk31Plus"
              style={styles.smallGlassOrb}
            >
              <RotateCcw size={18} color="#ffffff" />
              <Text style={styles.smallSkipText}>10</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayPause} activeOpacity={0.82}>
            <BlurView
              intensity={58}
              tint="dark"
              blurMethod="dimezisBlurViewSdk31Plus"
              style={styles.centerGlassPlay}
            >
              {isBuffering ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : isPlaying ? (
                <Pause size={24} color="#ffffff" fill="#ffffff" />
              ) : (
                <Play size={25} color="#ffffff" fill="#ffffff" style={{ marginLeft: 2 }} />
              )}
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sideSkipBtn}
            onPress={() => triggerSkip(10)}
            activeOpacity={0.75}
          >
            <BlurView
              intensity={42}
              tint="dark"
              blurMethod="dimezisBlurViewSdk31Plus"
              style={styles.smallGlassOrb}
            >
              <RotateCw size={18} color="#ffffff" />
              <Text style={styles.smallSkipText}>10</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Bottom Floating Liquid Glass Pill Dock */}
        <BlurView
          intensity={55}
          tint="dark"
          blurMethod="dimezisBlurViewSdk31Plus"
          style={styles.bottomGlassDock}
        >
          {/* Seekbar */}
          <View
            style={styles.seekTouchArea}
            onLayout={handleTrackLayout}
            {...seekPanResponder.panHandlers}
          >
            <View style={styles.seekTrack}>
              <View style={[styles.seekBuffered, { width: `${bufferedPct}%` }]} />
              <View
                style={[
                  styles.seekPlayed,
                  { width: `${playedPct}%`, backgroundColor: colors.accent },
                ]}
              />
              <View style={[styles.seekThumb, { left: `${playedPct}%` }]} />
            </View>
          </View>

          {/* Controls Row */}
          <View style={styles.dockRow}>
            <View style={styles.dockLeft}>
              <TouchableOpacity onPress={togglePlayPause} style={styles.dockIconBtn}>
                {isPlaying ? (
                  <Pause size={16} color="#ffffff" fill="#ffffff" />
                ) : (
                  <Play size={16} color="#ffffff" fill="#ffffff" />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleMute} style={styles.dockIconBtn}>
                {muted ? (
                  <VolumeX size={16} color="#ffffff" />
                ) : (
                  <Volume2 size={16} color="#ffffff" />
                )}
              </TouchableOpacity>

              <Text style={styles.timeText}>
                {formatTime(currentTime)} <Text style={styles.timeDim}>/ {formatTime(duration)}</Text>
              </Text>
            </View>

            <View style={styles.dockRight}>
              <TouchableOpacity style={styles.speedPill} onPress={cycleSpeed} activeOpacity={0.75}>
                <Text style={styles.speedText}>{SPEED_STEPS[speedIndex]}x</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onToggleFullscreen}
                style={styles.dockIconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {isFullscreen ? (
                  <Minimize2 size={16} color="#ffffff" />
                ) : (
                  <Maximize2 size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  gestureLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    zIndex: 10,
  },
  sideZone: {
    flex: 1,
  },
  centerZone: {
    flex: 1,
  },
  skipPillWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    zIndex: 25,
  },
  skipLeft: {
    left: '10%',
  },
  skipRight: {
    right: '10%',
  },
  skipBlurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.34)',
  },
  skipArrows: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -1,
  },
  skipLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  topGlassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 110,
  },
  titleGlassPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 20, 22, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    maxWidth: '100%',
  },
  titleGlassText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  sideSkipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallGlassOrb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  smallSkipText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    marginTop: -2,
  },
  centerGlassPlay: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.42)',
  },
  bottomGlassDock: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: 'rgba(18, 18, 22, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.24)',
    gap: 4,
  },
  seekTouchArea: {
    height: 18,
    justifyContent: 'center',
  },
  seekTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    position: 'relative',
  },
  seekBuffered: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  seekPlayed: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  seekThumb: {
    position: 'absolute',
    top: -4,
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dockIconBtn: {
    padding: 4,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  timeDim: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
  },
  speedPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  speedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
