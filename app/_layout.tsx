import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

import { GestureHandlerRootView } from "react-native-gesture-handler";

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
import { View } from "react-native";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import {getSecureStore} from "@/utils/secureStore";

configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

if (__DEV__) {
    console.log(`Access token: ${getSecureStore("accessToken")}`);
    console.log(`Refresh token: ${getSecureStore("refreshToken")}`);

    const originalLog = console.log;
    console.log = (...args: any[]) => {
        const cleanedArgs = args.map(arg => {
            if (typeof arg === 'string') {
                return arg
                    .split('\n')
                    .map(line => line.replace(/^LOG\s*/, ''))
                    .join('\n');
            }
            return arg;
        });

        if (cleanedArgs.length === 1 && typeof cleanedArgs[0] === 'string' && cleanedArgs[0].includes('\n')) {
            const lines = cleanedArgs[0].split('\n');
            for (const line of lines) {
                originalLog(line);
            }
        } else {
            originalLog(...cleanedArgs);
        }
    };

    const originalFetch = (globalThis as any).originalFetch || globalThis.fetch;
    if (!(globalThis as any).originalFetch) {
        (globalThis as any).originalFetch = originalFetch;
    }

    const activeRequests = new Set<string>();

    const formatBody = (body: any): string => {
        if (!body) return '';

        if (typeof FormData !== 'undefined' && body instanceof FormData) {
            const entries: Record<string, any> = {};
            body.forEach((value, key) => {
                entries[key] = value instanceof File
                    ? `[File: ${value.name}, ${value.size} bytes]`
                    : value;
            });
            return JSON.stringify(entries, null, 2);
        }

        if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
            const entries: Record<string, any> = {};
            body.forEach((value, key) => { entries[key] = value; });
            return JSON.stringify(entries, null, 2);
        }

        if (typeof body === 'object') {
            try {
                return JSON.stringify(body, null, 2);
            } catch {
                return String(body);
            }
        }


        if (typeof body === 'string') {
            try {
                const parsed = JSON.parse(body);
                return JSON.stringify(parsed, null, 2);
            } catch {
                return body;
            }
        }

        return String(body);
    };

    (globalThis as any).fetch = async (
        input: string | Request | URL,
        options?: RequestInit
    ): Promise<Response> => {
        let urlString = '';
        if (typeof input === 'string') {
            urlString = input;
        } else if (input && typeof input === 'object') {
            if ('url' in input) {
                urlString = (input as any).url;
            } else if (typeof input.toString === 'function') {
                urlString = input.toString();
            }
        }

        if (!urlString || urlString.includes('[object') || urlString.includes('logs') || urlString.includes('.bundle')) {
            return originalFetch(input as any, options);
        }

        const method = (
            options?.method ||
            (typeof input === 'object' && 'method' in input ? (input as any).method : 'GET')
        ).toUpperCase();

        const requestBody = options?.body || (typeof input === 'object' && 'body' in input ? (input as any).body : null);
        const bodyString = requestBody ? String(requestBody) : '';
        const requestKey = `${method}_${urlString}_${bodyString}`;

        if (activeRequests.has(requestKey)) {
            return originalFetch(input as any, options);
        }
        activeRequests.add(requestKey);

        const reset = '\x1b[0m';
        const bold = '\x1b[1m';
        const dim = '\x1b[2m';

        const fgCyan = '\x1b[36m';
        const fgYellow = '\x1b[33m';
        const fgGreen = '\x1b[32m';
        const fgRed = '\x1b[31m';
        const fgMagenta = '\x1b[35m';

        const bgBlue = '\x1b[44m\x1b[37m\x1b[1m';
        const bgRed = '\x1b[41m\x1b[37m\x1b[1m';
        const bgGreen = '\x1b[42m\x1b[30m\x1b[1m';
        const bgYellow = '\x1b[43m\x1b[30m\x1b[1m';

        const startTime = performance.now();
        const timeFormatted = new Date().toLocaleTimeString();

        console.log(`\n┌────── ${bgBlue} OUTGOING REQUEST ${reset} ${dim}[${timeFormatted}]${reset}`);
        console.log(`│ ${bold}${fgCyan}${method}${reset} ➔ ${fgCyan}${urlString}${reset}`);

        if (options?.headers) {
            console.log(`│ ${dim}Headers:${reset}`, options.headers);
        }

        if (requestBody) {
            const formattedBody = formatBody(requestBody);
            if (formattedBody) {
                console.log(`│ ${fgYellow}📦 Request Body:${reset}\n│ ${formattedBody.replace(/\n/g, '\n│ ')}`);
            }
        }

        try {
            const response = await originalFetch(input as any, options);
            const duration = Math.round(performance.now() - startTime);
            const clone = response.clone();

            clone.text().then((text: string) => {
                const isSuccess = response.status >= 200 && response.status < 300;
                const isRedirect = response.status >= 300 && response.status < 400;

                let statusBadge = `${bgRed} ERROR ${reset}`;
                let statusColor = fgRed;

                if (isSuccess) {
                    statusBadge = `${bgGreen} SUCCESS ${reset}`;
                    statusColor = fgGreen;
                } else if (isRedirect) {
                    statusBadge = `${bgYellow} REDIRECT ${reset}`;
                    statusColor = fgYellow;
                }

                console.log(`│`);
                console.log(`├────── ${statusBadge} ${statusColor}${response.status} ${response.statusText}${reset} ${dim}(${duration}ms)${reset}`);

                if (text) {
                    try {
                        const json = JSON.parse(text);
                        console.log(`│ ${fgMagenta}📄 Response (JSON):${reset}\n│ ${JSON.stringify(json, null, 2).replace(/\n/g, '\n│ ')}`);
                    } catch {
                        const preview = text.length > 400 ? `${text.substring(0, 400)}...` : text;
                        console.log(`│ ${fgMagenta}📄 Response (Text):${reset} ${preview}`);
                    }
                } else {
                    console.log(`│ ${dim}📄 Response: <Empty>${reset}`);
                }

                console.log(`└────────────────────────────────────────────────────\n`);
            }).catch(() => {
                console.log(`└────────────────────────────────────────────────────\n`);
            }).finally(() => {
                setTimeout(() => activeRequests.delete(requestKey), 200);
            });

            return response;
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            console.log(`│`);
            console.log(`├────── ${bgRed} FAILED ${reset} ${fgRed}Network Error${reset} ${dim}(${duration}ms)${reset}`);
            console.error(`│ ${fgRed}Error details:${reset}`, error);
            console.log(`└────────────────────────────────────────────────────\n`);

            activeRequests.delete(requestKey);
            throw error;
        }
    };
}

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
            <GestureHandlerRootView style={{ flex: 1 }}>
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
                    name="(test)"
                    options={{ headerShown: false }}
                />

                <Stack.Screen
                    name="(tabs)"
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

            </GestureHandlerRootView>
            <StatusBar
                style={colorScheme === 'dark' ? 'light' : 'dark'}
            />

            <PortalHost />
        </Provider>
    );
}
