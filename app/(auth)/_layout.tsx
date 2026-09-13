import {router, Stack} from "expo-router";
import {useEffect} from "react";
import {getSecureStore} from "@/utils/secureStore";

export default function AuthLayout() {
    useEffect(() => {
        if (getSecureStore("refreshToken")) {
            router.replace("/(main)/test");
        }
    }, [])

    if (!getSecureStore("refreshToken")) {
        return (
            <Stack
                screenOptions={{
                    headerShown: false,

                    // Прибираємо стандартний swipe-back
                    gestureEnabled: false,

                    // Власна анімація
                    animation: "fade",
                    animationDuration: 300,

                    contentStyle: {
                        backgroundColor: "#FFC244",
                    },
                }}
            />
        );
    }
}