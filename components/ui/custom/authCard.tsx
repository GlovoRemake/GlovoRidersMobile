import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from "react-native-reanimated";
import { useEffect } from "react";

export function AuthCard({
                      children,
                  }: {
    children: React.ReactNode;
}) {
    const translateY = useSharedValue(40);
    const scale = useSharedValue(0.96);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = withSpring(0, {
            damping: 18,
            stiffness: 180,
        });

        scale.value = withSpring(1, {
            damping: 18,
            stiffness: 180,
        });

        opacity.value = withSpring(1, {
            damping: 20,
            stiffness: 150,
        });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: translateY.value },
            { scale: scale.value },
        ],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={animatedStyle}
            className={"-mt-8 mx-2 rounded-[30px] bg-white px-6 pb-10 pt-7 dark:bg-[#121518]"}
        >
            {children}
        </Animated.View>
    );
}
