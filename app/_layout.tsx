import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { PortalHost } from '@rn-primitives/portal';
import { Provider } from 'react-redux';
import { store } from '@/store';

import { useFonts } from '@expo-google-fonts/nunito';
import {
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {View} from "react-native";
import {configureReanimatedLogger, ReanimatedLogLevel} from "react-native-reanimated";

configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const [fontsLoaded] = useFonts({
        Nunito: Nunito_400Regular,
        NunitoMedium: Nunito_500Medium,
        NunitoSemiBold: Nunito_600SemiBold,
        NunitoBold: Nunito_700Bold,
        NunitoExtraBold: Nunito_800ExtraBold,
        NunitoBlack: Nunito_900Black,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <Provider store={store}>
            <Stack>
                <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="(main)/test"
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="modal"
                    options={{
                        presentation: 'modal',
                        title: 'Modal',
                    }}
                />
            </Stack>

            <StatusBar
                style={colorScheme === 'dark' ? 'light' : 'dark'}
            />

            <PortalHost />
        </Provider>
    );
}
