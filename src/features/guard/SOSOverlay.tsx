import { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet, Pressable, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Button, IconSymbol, Text } from '@/components';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { playSirenSound, stopSirenSound } from '@/lib/soundManager';

interface ActiveSosData {
  id: string;
  flat_id: string | null;
  created_by: string;
  created_at: string;
  resident_name?: string;
  flat_label?: string;
}

export function SOSOverlay() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const guardId = useAuthStore((s) => s.session?.user?.id);
  const societyId = profile?.society_id;
  const isGuard = profile?.role === 'guard';

  const [activeSos, setActiveSos] = useState<ActiveSosData | null>(null);
  const [elapsedText, setElapsedText] = useState('');
  const [resolving, setResolving] = useState(false);

  const flashAnim = useRef(new Animated.Value(0.1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Strobe flash and pulse animations
  useEffect(() => {
    if (activeSos) {
      // Flashing strobe animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0.1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Icon pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Play Siren Sound
      void playSirenSound();
      
      // Multi-haptic trigger on guards device
      const interval = setInterval(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 1500);

      return () => {
        clearInterval(interval);
        flashAnim.setValue(0.1);
        scaleAnim.setValue(1);
        void stopSirenSound();
      };
    }
  }, [activeSos, flashAnim, scaleAnim]);

  // 2. Elapsed Timer updater
  useEffect(() => {
    if (activeSos) {
      const updateTimer = () => {
        const start = new Date(activeSos.created_at).getTime();
        const diffSeconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
        if (diffSeconds < 60) {
          setElapsedText(t('sos.secondsAgo', { count: diffSeconds }));
        } else {
          setElapsedText(t('sos.minutesAgo', { count: Math.floor(diffSeconds / 60) }));
        }
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [activeSos, t]);

  // Fetch resident name and flat label for the alert
  const fetchAlertContext = async (sosId: string, createdBy: string, flatId: string | null) => {
    try {
      let residentName = 'Resident';
      let flatLabel = 'Unknown Flat';

      // Fetch resident profile name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', createdBy)
        .maybeSingle();
      if (profileData?.full_name) {
        residentName = profileData.full_name;
      }

      // Fetch flat details if present
      if (flatId) {
        const { data: flatData } = await supabase
          .from('flats')
          .select(`
            number,
            towers (
              name
            )
          `)
          .eq('id', flatId)
          .maybeSingle();

        if (flatData) {
          const towerName = (flatData.towers as { name?: string } | null)?.name || '';
          flatLabel = `${towerName ? `${towerName} - ` : ''}${flatData.number}`;
        }
      }

      setActiveSos((prev) => {
        if (prev && prev.id === sosId) {
          return { ...prev, resident_name: residentName, flat_label: flatLabel };
        }
        return prev;
      });
    } catch (e) {
      console.warn('[sos] failed to fetch context', e);
    }
  };

  // 3. Query active alert on mount & listen to changes
  useEffect(() => {
    if (!isGuard || !societyId) return;

    // Load initial active SOS if any
    const loadInitialActiveSos = async () => {
      try {
        const { data, error } = await supabase
          .from('sos_alerts')
          .select('*')
          .eq('society_id', societyId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setActiveSos({
            id: data.id,
            flat_id: data.flat_id,
            created_by: data.created_by,
            created_at: data.created_at,
          });
          void fetchAlertContext(data.id, data.created_by, data.flat_id);
        }
      } catch (err) {
        console.warn('[sos] failed to load active sos', err);
      }
    };

    void loadInitialActiveSos();

    // Subscribe to realtime insert/update events
    const channel = supabase
      .channel(`guard-sos-alerts-${societyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts',
          filter: `society_id=eq.${societyId}`,
        },
        (payload) => {
          const newRow = payload.new as {
            id: string;
            flat_id: string | null;
            created_by: string;
            status: string;
            created_at: string;
            society_id: string;
          } | null;

          if (payload.eventType === 'INSERT' && newRow && newRow.status === 'active') {
            setActiveSos({
              id: newRow.id,
              flat_id: newRow.flat_id,
              created_by: newRow.created_by,
              created_at: newRow.created_at,
            });
            void fetchAlertContext(newRow.id, newRow.created_by, newRow.flat_id);
          } else if (payload.eventType === 'UPDATE' && newRow) {
            // If the active alert is resolved or acknowledged, close the overlay on all guards' devices
            setActiveSos((current) => {
              if (current && current.id === newRow.id && (newRow.status === 'resolved' || newRow.status === 'acknowledged')) {
                return null;
              }
              return current;
            });
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isGuard, societyId]);

  const handleAcknowledge = async () => {
    if (!activeSos || !guardId) return;
    setResolving(true);
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({
          status: 'acknowledged',
          resolved_by: guardId,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', activeSos.id);

      if (error) throw error;
      setActiveSos(null);
    } catch (err) {
      console.warn('[sos] failed to resolve alert', err);
    } finally {
      setResolving(false);
    }
  };

  if (!activeSos) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} className="z-[9999] justify-center items-center bg-black/95">
      {/* Background flashing strobe */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: '#ef4444',
            opacity: flashAnim,
          },
        ]}
      />

      <View className="w-[92%] max-w-[420px] bg-[#141518] dark:bg-[#101114] rounded-3xl p-6 border-2 border-red-500/80 shadow-2xl items-center">
        {/* Pulsing Concentric Aura Ring & Warning Icon */}
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="w-24 h-24 rounded-full bg-red-500/15 border border-red-500/30 items-center justify-center mb-1"
        >
          <View className="w-16 h-16 rounded-full bg-red-600 items-center justify-center shadow-lg">
            <IconSymbol name="warning" color="onPrimary" size={36} />
          </View>
        </Animated.View>

        {/* Title & Timer Pill */}
        <Text variant="headline" className="text-red-500 font-black text-center tracking-widest uppercase mt-2">
          {t('sos.emergencyAlert')}
        </Text>
        <View className="flex-row items-center gap-2 bg-red-950/70 border border-red-500/40 px-4 py-1.5 rounded-full mt-2">
          <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <Text variant="caption" className="text-red-300 font-semibold tracking-wider">
            {t('sos.timeElapsed').toUpperCase()}: {elapsedText}
          </Text>
        </View>

        {/* Dispatch Incident Details Card */}
        <View className="w-full bg-[#1e2025] dark:bg-[#181a1f] border border-red-500/30 rounded-2xl p-5 my-5 gap-4">
          {/* Location Section */}
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <View className="w-7 h-7 rounded-lg bg-red-500/15 items-center justify-center">
                <IconSymbol name="apartment" color="error" size={16} />
              </View>
              <Text variant="caption" className="text-red-400 font-bold uppercase tracking-wider">
                Location / Flat
              </Text>
            </View>
            <Text variant="headline" className="text-white font-black text-2xl tracking-tight pl-9">
              {activeSos.flat_label || 'Unknown Flat'}
            </Text>
          </View>

          <View className="h-[1px] w-full bg-red-500/20" />

          {/* Resident Section */}
          <View className="gap-1">
            <View className="flex-row items-center gap-2">
              <View className="w-7 h-7 rounded-lg bg-red-500/15 items-center justify-center">
                <IconSymbol name="person" color="error" size={16} />
              </View>
              <Text variant="caption" className="text-red-400 font-bold uppercase tracking-wider">
                Resident Name
              </Text>
            </View>
            <Text variant="titleLarge" className="text-white font-bold pl-9">
              {activeSos.resident_name || 'Unknown Resident'}
            </Text>
          </View>
        </View>

        {/* Action Button & Subtitle */}
        <View className="w-full gap-2">
          <Button
            label={t('sos.acknowledgeAndDismiss')}
            variant="danger"
            size="lg"
            full
            icon="check_circle"
            loading={resolving}
            onPress={handleAcknowledge}
          />
          <Text variant="caption" className="text-gray-400 text-center text-xs">
            Press to acknowledge dispatch & silence emergency alarm
          </Text>
        </View>
      </View>
    </View>
  );
}
