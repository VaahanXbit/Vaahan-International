import React, { useRef, useState } from 'react';
import { StyleSheet, View, Text, Animated, PanResponder } from 'react-native';

interface SlideButtonProps {
  onSlideSuccess: () => void;
  width?: number;
}

export function SlideButton({ onSlideSuccess, width = 280 }: SlideButtonProps) {
  const pan = useRef(new Animated.Value(0)).current;
  const [sliderWidth, setSliderWidth] = useState(width);
  const buttonWidth = 50;
  const maxDistance = sliderWidth - buttonWidth - 8; // padding of container

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx >= 0 && gestureState.dx <= maxDistance) {
          pan.setValue(gestureState.dx);
        } else if (gestureState.dx > maxDistance) {
          pan.setValue(maxDistance);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= maxDistance * 0.8) {
          Animated.timing(pan, {
            toValue: maxDistance,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            onSlideSuccess();
            // Reset position after navigation/action completes
            setTimeout(() => {
              Animated.spring(pan, {
                toValue: 0,
                friction: 8,
                useNativeDriver: true,
              }).start();
            }, 500);
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const textOpacity = pan.interpolate({
    inputRange: [0, maxDistance * 0.6],
    outputRange: [1, 0.15],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.sliderContainer, { width: sliderWidth }]}
      onLayout={(e) => {
        const { width: layoutWidth } = e.nativeEvent.layout;
        setSliderWidth(layoutWidth);
      }}
    >
      <Animated.Text style={[styles.sliderText, { opacity: textOpacity }]}>
        Slide to End Trip ➔
      </Animated.Text>
      <Animated.View
        style={[
          styles.sliderHandle,
          {
            transform: [{ translateX: pan }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.handleArrow}>➔</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderContainer: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E1B26', // Dark background track
    borderWidth: 1,
    borderColor: '#EF444433', // Muted red border
    justifyContent: 'center',
    padding: 4,
    position: 'relative',
    marginTop: 32,
    width: '100%',
  },
  sliderText: {
    position: 'absolute',
    alignSelf: 'center',
    color: '#EF444499', // Muted red text
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sliderHandle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EF4444', // Solid Red handle
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2.5,
    elevation: 4,
  },
  handleArrow: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
