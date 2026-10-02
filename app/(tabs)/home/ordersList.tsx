"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    Text,
    View,
    useColorScheme,
} from "react-native";
import * as Location from "expo-location";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
    HubConnectionBuilder,
    LogLevel,
} from "@microsoft/signalr";
import {
    MapPin,
    Package,
    ChevronRight,
    Navigation,
    CircleDollarSign,
    Store,
    X,
    Wifi,
    WifiOff,
} from "lucide-react-native";

import {useAcceptOrderMutation, useGetOrdersQuery} from "@/store/service/apiOrders";
import { IOrder } from "@/types/order/IOrder";
import { AvailableOrderCard } from "@/components/ui/custom/OrderCards";
import APP_ENV from "@/utils/env";
import {getSecureStore, saveSecureStore} from "@/utils/secureStore";
import {useRefreshMutation} from "@/store/service/apiAccount";

const SIGNALR_URL = `${APP_ENV.API_URL}/hubs/courier`;

export default function CourierScreen() {
    const scheme = useColorScheme();
    const dark = scheme === "dark";

    const theme = {
        bg: dark ? "#09090B" : "#F7F7F8",
        card: dark ? "#121214" : "#FFFFFF",
        card2: dark ? "#18181B" : "#F1F1F3",
        border: dark ? "#27272A" : "#E4E4E7",
        text: dark ? "#FAFAFA" : "#18181B",
        muted: dark ? "#A1A1AA" : "#71717A",
        green: "#22C55E",
        greenBg: dark ? "#17261D" : "#EAF8EF",
        sheet: dark ? "#111113" : "#FFFFFF",
        iconBg: dark ? "#18181B" : "#F4F4F5",
    };

    const [location, setLocation] =
        useState<Location.LocationObjectCoords | null>(null);

    const [locationLoading, setLocationLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [selectedOrder, setSelectedOrder] =
        useState<IOrder | null>(null);
    const [newOrders, setNewOrders] = useState<IOrder[]>([]);

    const connectionRef = useRef<any>(null);
    const locationSubscription =
        useRef<Location.LocationSubscription | null>(null);

    const bottomSheetRef = useRef<BottomSheet>(null);

    const [acceptOrder, {isLoading: isAccepting}] = useAcceptOrderMutation();

    const {
        data: orders = [],
        isLoading,
        isFetching,
    } = useGetOrdersQuery(
        {
            latitude: location?.latitude ?? 0,
            longitude: location?.longitude ?? 0,
        },
        {
            skip: !location,
        }
    );

    const startLocation = useCallback(async () => {
        try {
            setLocationLoading(true);

            const { status } =
                await Location.requestForegroundPermissionsAsync();

            if (status !== "granted") {
                Alert.alert(
                    "Потрібна геолокація",
                    "Дозволь доступ до геолокації для роботи кур'єра."
                );
                return;
            }

            const current =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

            setLocation(current.coords);

            locationSubscription.current =
                await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 20,
                        timeInterval: 5000,
                    },
                    ({ coords }) => setLocation(coords)
                );
        } catch (error) {
            console.log("LOCATION ERROR:", error);
        } finally {
            setLocationLoading(false);
        }
    }, []);

    useEffect(() => {
        startLocation();

        return () => {
            locationSubscription.current?.remove();
            locationSubscription.current = null;
        };
    }, [startLocation]);

    const [refreshToken] = useRefreshMutation();

    useEffect(() => {
        let cancelled = false;
        let retryTimeout: ReturnType<typeof setTimeout> | null = null;
        let refreshing = false;

        const refreshAndReconnect = async () => {
            if (refreshing || cancelled) {
                return false;
            }

            refreshing = true;

            try {
                console.log("🔄 ACCESS TOKEN EXPIRED, REFRESHING...");

                const success = await refreshToken(getSecureStore("refreshToken") ?? "");

                if (!success) {
                    console.log("❌ TOKEN REFRESH FAILED");
                    return false;
                }


                saveSecureStore("refreshToken", success?.data?.refreshToken ?? "");
                saveSecureStore("accessToken", success?.data?.accessToken ?? "");
                console.log("🟢 TOKEN REFRESHED");

                return true;
            } catch (error) {
                console.log("❌ REFRESH ERROR:", error);
                return false;
            } finally {
                refreshing = false;
            }
        };

        const connect = async () => {
            const token = getSecureStore("accessToken");

            if (
                cancelled ||
                !location ||
                !token ||
                connectionRef.current
            ) {
                return;
            }

            const connection = new HubConnectionBuilder()
                .withUrl(
                    `${SIGNALR_URL}?lat=${location.latitude}&lng=${location.longitude}`,
                    {
                        accessTokenFactory: async () => {
                            let token = getSecureStore("accessToken");

                            if (!token) {
                                const refreshed = await refreshAndReconnect();

                                if (!refreshed) {
                                    return "";
                                }

                                token = getSecureStore("accessToken");
                            }

                            return token ?? "";
                        },
                    }
                )
                .withAutomaticReconnect([
                    0,
                    2000,
                    5000,
                    10000,
                    30000,
                ])
                .configureLogging(LogLevel.Warning)
                .build();

            connection.on("Connected", data => {
                console.log("🟢 COURIER CONNECTED:", data);
                setConnected(true);
            });

            connection.on("NewOrder", order => {
                setNewOrders(prev => {
                    if (prev.some(x => x.id === order.id)) {
                        return prev;
                    }

                    return [order, ...prev];
                });
            });

            connection.onreconnecting(async error => {
                console.log("🟡 SIGNALR RECONNECTING:", error);

                setConnected(false);

                // Якщо reconnect викликаний через 401
                if (
                    error?.message?.includes("401") ||
                    error?.message?.toLowerCase().includes("unauthorized")
                ) {
                    await refreshAndReconnect();
                }
            });

            connection.onreconnected(() => {
                console.log("🟢 SIGNALR RECONNECTED");
                setConnected(true);
            });

            connection.onclose(async error => {
                console.log("🔴 SIGNALR CLOSED:", error);

                setConnected(false);
                connectionRef.current = null;

                if (!cancelled) {
                    const message = error?.message?.toLowerCase() ?? "";

                    if (
                        message.includes("401") ||
                        message.includes("unauthorized")
                    ) {
                        await refreshAndReconnect();
                    }

                    retryTimeout = setTimeout(connect, 3000);
                }
            });

            try {
                await connection.start();

                if (cancelled) {
                    await connection.stop();
                    return;
                }

                connectionRef.current = connection;
                setConnected(true);

                console.log("🟢 SIGNALR STARTED");
            } catch (error: any) {
                console.log("SIGNALR ERROR:", error);

                setConnected(false);

                // 401 → refresh token
                const message =
                    error?.message?.toLowerCase() ?? "";

                if (
                    message.includes("401") ||
                    message.includes("unauthorized")
                ) {
                    const refreshed = await refreshAndReconnect();

                    if (refreshed && !cancelled) {
                        retryTimeout = setTimeout(connect, 100);
                    }

                    return;
                }

                if (!cancelled) {
                    retryTimeout = setTimeout(connect, 3000);
                }
            }
        };

        connect();

        return () => {
            cancelled = true;

            if (retryTimeout) {
                clearTimeout(retryTimeout);
            }

            const connection = connectionRef.current;
            connectionRef.current = null;

            if (connection) {
                connection.stop().catch(() => {});
            }

            setConnected(false);
        };
    }, [location?.latitude, location?.longitude]);

    const displayedOrders = useMemo(() => {
        const ids = new Set(newOrders.map(order => order.id));

        return [
            ...newOrders,
            ...(orders as IOrder[]).filter(
                order => !ids.has(order.id)
            ),
        ];
    }, [newOrders, orders]);

    const getPickupAddress = (order: IOrder) =>
        [
            order.affiliate.location.address,
            order.affiliate.location.location !== "123123"
                ? order.affiliate.location.location
                : null,
            order.affiliate.location.region,
        ]
            .filter(Boolean)
            .join(", ");

    const getDropoffAddress = (order: IOrder) =>
        [
            order.userLocation.address,
            order.userLocation.city.name,
            order.userLocation.city.region.name,
        ]
            .filter(Boolean)
            .join(", ");

    const openOrder = (order: IOrder) => {
        setSelectedOrder(order);
        bottomSheetRef.current?.expand();
    };

    const acceptOrderSubmit = async () => {
        try {
            await acceptOrder(selectedOrder?.id ?? -1);
        } catch (error) {
            console.log(error);
        }
    };

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={dark ? 0.7 : 0.35}
            />
        ),
        [dark]
    );

    return (
        <View
            className="flex-1"
            style={{ backgroundColor: theme.bg }}
        >
            <View className="px-5 pt-16 pb-5">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text
                            style={{
                                color: theme.text,
                                fontSize: 28,
                                fontWeight: "800",
                            }}
                        >
                            Замовлення
                        </Text>
                    </View>
                </View>
            </View>

            <View className="flex-1">
                {locationLoading || isLoading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator
                            size="large"
                            color={theme.green}
                        />

                        <Text
                            className="mt-4"
                            style={{ color: theme.muted }}
                        >
                            Завантаження замовлень...
                        </Text>
                    </View>
                ) : displayedOrders.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-8">
                        <View
                            className="h-20 w-20 items-center justify-center rounded-3xl"
                            style={{
                                backgroundColor: theme.card,
                                borderWidth: 1,
                                borderColor: theme.border,
                            }}
                        >
                            <Package
                                size={32}
                                color={theme.muted}
                            />
                        </View>

                        <Text
                            className="mt-5 text-center"
                            style={{
                                color: theme.text,
                                fontSize: 19,
                                fontWeight: "700",
                            }}
                        >
                            Поки немає замовлень
                        </Text>

                        <Text
                            className="mt-2 text-center"
                            style={{
                                color: theme.muted,
                                fontSize: 14,
                                lineHeight: 21,
                            }}
                        >
                            Нові замовлення з&#39;являться тут
                            автоматично.
                        </Text>

                        {isFetching && (
                            <ActivityIndicator
                                className="mt-5"
                                color={theme.green}
                            />
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={displayedOrders}
                        keyExtractor={item =>
                            item.id.toString()
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingHorizontal: 20,
                            paddingBottom: 40,
                        }}
                        renderItem={({ item, index }) => (
                            <View
                                className={
                                    index !== 0
                                        ? "mt-3"
                                        : ""
                                }
                            >
                                <AvailableOrderCard
                                    order={{
                                        id: item.id.toString(),
                                        restaurant:
                                        item.company.name,
                                        pickupAddress:
                                        item.affiliate.location
                                            .address,
                                        dropoffAddress:
                                        item.userLocation
                                            .address,
                                        distanceKm: 0,
                                        etaMin: 0,
                                        payout:
                                            item.deliveryFee +
                                            item.tipAmount,
                                    }}
                                    onAccept={() =>
                                        openOrder(item)
                                    }
                                />
                            </View>
                        )}
                    />
                )}
            </View>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={["58%", "82%"]}
                enablePanDownToClose
                backgroundStyle={{
                    backgroundColor: theme.sheet,
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                }}
                handleIndicatorStyle={{
                    backgroundColor: theme.muted,
                    width: 42,
                }}
                backdropComponent={renderBackdrop}
                onClose={() => setSelectedOrder(null)}
            >
                <BottomSheetView className="flex-1 px-5">
                    {selectedOrder && (
                        <>
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text
                                        style={{
                                            color: theme.text,
                                            fontSize: 24,
                                            fontWeight: "800",
                                        }}
                                    >
                                        Замовлення #
                                        {selectedOrder.id}
                                    </Text>

                                    <Text
                                        className="mt-1"
                                        style={{
                                            color: theme.muted,
                                            fontSize: 13,
                                        }}
                                    >
                                        Деталі доставки
                                    </Text>
                                </View>

                                <Pressable
                                    onPress={() =>
                                        bottomSheetRef.current?.close()
                                    }
                                    className="h-10 w-10 items-center justify-center rounded-xl"
                                    style={{
                                        backgroundColor:
                                        theme.card2,
                                    }}
                                >
                                    <X
                                        size={19}
                                        color={theme.muted}
                                    />
                                </Pressable>
                            </View>

                            <View className="mt-7">
                                <View className="flex-row">
                                    <View className="items-center">
                                        <View
                                            className="h-10 w-10 items-center justify-center rounded-xl"
                                            style={{
                                                backgroundColor:
                                                theme.greenBg,
                                            }}
                                        >
                                            <Navigation
                                                size={18}
                                                color={theme.green}
                                            />
                                        </View>

                                        <View
                                            className="my-1 w-px flex-1"
                                            style={{
                                                backgroundColor:
                                                theme.border,
                                            }}
                                        />
                                    </View>

                                    <View className="ml-4 flex-1 pb-5">
                                        <Text
                                            style={{
                                                color: theme.muted,
                                                fontSize: 11,
                                                fontWeight: "700",
                                            }}
                                        >
                                            ВИ ЗНАХОДИТЕСЬ
                                        </Text>

                                        <Text
                                            className="mt-1"
                                            style={{
                                                color: theme.text,
                                                fontSize: 14,
                                            }}
                                        >
                                            {location
                                                ? `${location.latitude.toFixed(
                                                    5
                                                )}, ${location.longitude.toFixed(
                                                    5
                                                )}`
                                                : "Невідомо"}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row">
                                    <View className="items-center">
                                        <View
                                            className="h-10 w-10 items-center justify-center rounded-xl"
                                            style={{
                                                backgroundColor:
                                                    dark
                                                        ? "#211C16"
                                                        : "#FFF7E8",
                                            }}
                                        >
                                            <Store
                                                size={18}
                                                color="#F59E0B"
                                            />
                                        </View>

                                        <View
                                            className="my-1 w-px flex-1"
                                            style={{
                                                backgroundColor:
                                                theme.border,
                                            }}
                                        />
                                    </View>

                                    <View className="ml-4 flex-1 pb-5">
                                        <Text
                                            style={{
                                                color: theme.muted,
                                                fontSize: 11,
                                                fontWeight: "700",
                                            }}
                                        >
                                            ЗАБРАТИ
                                        </Text>

                                        <Text
                                            className="mt-1"
                                            style={{
                                                color: theme.text,
                                                fontSize: 16,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {
                                                selectedOrder
                                                    .company
                                                    .name
                                            }
                                        </Text>

                                        <Text
                                            className="mt-1"
                                            style={{
                                                color: theme.muted,
                                                fontSize: 13,
                                                lineHeight: 19,
                                            }}
                                        >
                                            {getPickupAddress(
                                                selectedOrder
                                            )}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row">
                                    <View className="h-10 w-10 items-center justify-center rounded-xl">
                                        <MapPin
                                            size={19}
                                            color="#EF4444"
                                        />
                                    </View>

                                    <View className="ml-4 flex-1">
                                        <Text
                                            style={{
                                                color: theme.muted,
                                                fontSize: 11,
                                                fontWeight: "700",
                                            }}
                                        >
                                            ДОСТАВИТИ
                                        </Text>

                                        <Text
                                            className="mt-1"
                                            style={{
                                                color: theme.text,
                                                fontSize: 16,
                                                fontWeight: "700",
                                            }}
                                        >
                                            {
                                                selectedOrder.user
                                                    .firstName
                                            }{" "}
                                            {
                                                selectedOrder.user
                                                    .lastName
                                            }
                                        </Text>

                                        <Text
                                            className="mt-1"
                                            style={{
                                                color: theme.muted,
                                                fontSize: 13,
                                                lineHeight: 19,
                                            }}
                                        >
                                            {getDropoffAddress(
                                                selectedOrder
                                            )}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View
                                className="mt-7 flex-row items-center justify-between rounded-2xl px-4 py-4"
                                style={{
                                    backgroundColor: theme.card,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                }}
                            >
                                <View className="flex-row items-center">
                                    <View
                                        className="h-10 w-10 items-center justify-center rounded-xl"
                                        style={{
                                            backgroundColor:
                                            theme.greenBg,
                                        }}
                                    >
                                        <CircleDollarSign
                                            size={19}
                                            color={theme.green}
                                        />
                                    </View>

                                    <View className="ml-3">
                                        <Text
                                            style={{
                                                color: theme.muted,
                                                fontSize: 12,
                                            }}
                                        >
                                            Ваш заробіток
                                        </Text>

                                        <Text
                                            className="mt-0.5"
                                            style={{
                                                color: theme.text,
                                                fontSize: 18,
                                                fontWeight: "800",
                                            }}
                                        >
                                            {(
                                                selectedOrder
                                                    .deliveryFee +
                                                selectedOrder.tipAmount
                                            ).toFixed(2)}{" "}
                                            ₴
                                        </Text>
                                    </View>
                                </View>

                                <ChevronRight
                                    size={19}
                                    color={theme.muted}
                                />
                            </View>

                            <Pressable
                                onPress={acceptOrderSubmit}
                                className="mt-4 rounded-2xl py-4"
                                disabled={isAccepting}
                                style={{
                                    backgroundColor:
                                    theme.green,
                                }}
                            >
                                <Text
                                    className="text-center"
                                    style={{
                                        color: "#052E16",
                                        fontSize: 16,
                                        fontWeight: "800",
                                    }}
                                >
                                    Прийняти замовлення
                                </Text>
                            </Pressable>
                        </>
                    )}
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
}