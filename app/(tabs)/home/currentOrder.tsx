"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import {
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from "@microsoft/signalr";
import {
    ChefHat,
    CircleAlert,
    MapPin,
    Navigation,
    Package,
    Phone,
    Store,
    Truck,
} from "lucide-react-native";

import {useConfirmDeliveryMutation, useCurrentOrderQuery} from "@/store/service/apiOrders";
import APP_ENV from "@/utils/env";
import { getSecureStore } from "@/utils/secureStore";
import { IOrder } from "@/types/order/IOrder";
import { OrderStatus } from "@/types/order/OrderStatus";
import {useDispatch} from "react-redux";
import {useAppDispatch} from "@/store";
import {apiAccount} from "@/store/service/apiAccount";
import { Linking } from "react-native";

const SIGNALR_URL = `${APP_ENV.API_URL}/hubs/courier`;

type Coordinates = {
    latitude: number;
    longitude: number;
};

export default function CurrentOrder() {
    const scheme = useColorScheme();
    const dark = scheme === "dark";

    const { data: order, isLoading } = useCurrentOrderQuery();
    const [confirmDelivery, {isLoading: isConfirming}] = useConfirmDeliveryMutation();

    const [status, setStatus] = useState<OrderStatus | null>(null);

    const dispatch = useAppDispatch();

    const [courierLocation, setCourierLocation] =
        useState<Coordinates | null>(null);

    const connectionRef = useRef<any>(null);

    const locationSubscription =
        useRef<Location.LocationSubscription | null>(null);

    const theme = useMemo(
        () => ({
            bg: dark ? "#09090B" : "#F7F7F8",
            card: dark ? "#121214" : "#FFFFFF",
            card2: dark ? "#18181B" : "#F1F1F3",
            border: dark ? "#27272A" : "#E4E4E7",
            text: dark ? "#FAFAFA" : "#18181B",
            muted: dark ? "#A1A1AA" : "#71717A",

            green: "#22C55E",
            greenBg: dark ? "#17261D" : "#EAF8EF",

            red: "#EF4444",
            redBg: dark ? "#301719" : "#FDECEC",

            orange: "#F59E0B",
            orangeBg: dark ? "#302611" : "#FFF7E6",
        }),
        [dark]
    );

    useEffect(() => {
        if (order) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setStatus(order.status);
        }
    }, [order]);

    /*
     * SignalR
     */
    useEffect(() => {
        if (!order) return;

        let cancelled = false;

        const connect = async () => {
            const token = getSecureStore("accessToken");

            if (!token || cancelled || connectionRef.current) {
                return;
            }

            const connection = new HubConnectionBuilder()
                .withUrl(SIGNALR_URL, {
                    accessTokenFactory: () =>
                        getSecureStore("accessToken") ?? "",
                })
                .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
                .configureLogging(LogLevel.Warning)
                .build();
            
            connection.on("OrderStatusUpdated", (data) => {
                if (data?.id === order.id && data?.status !== undefined) {
                    setStatus(data.status);
                }
            });

            connection.on("OrderUpdated", (data) => {
                if (data?.id === order.id) {
                    setStatus(data.status);
                }
            });

            connection.on("CourierLocationUpdated", (data) => {
                if (data?.orderId !== order.id) {
                    return;
                }

                if (
                    typeof data.latitude !== "number" ||
                    typeof data.longitude !== "number"
                ) {
                    return;
                }

                setCourierLocation({
                    latitude: data.latitude,
                    longitude: data.longitude,
                });
            });

            connection.onreconnected(() => {
                console.log("🟢 CURRENT ORDER SIGNALR RECONNECTED");
            });

            connection.onreconnecting(() => {
                console.log("🟡 CURRENT ORDER SIGNALR RECONNECTING");
            });

            connection.onclose(() => {
                console.log("🔴 CURRENT ORDER SIGNALR CLOSED");

                connectionRef.current = null;
            });

            try {
                await connection.start();
                await connection.invoke("JoinOrder", order.id);

                if (cancelled) {
                    await connection.stop();
                    return;
                }

                connectionRef.current = connection;

                console.log("🟢 CURRENT ORDER SIGNALR CONNECTED");
            } catch (error) {
                console.log("SIGNALR ERROR:", error);
            }
        };

        connect();

        return () => {
            cancelled = true;

            const connection = connectionRef.current;

            connectionRef.current = null;

            if (connection) {
                connection.stop().catch(() => {});
            }
        };
    }, [order?.id]);

    /*
     * Courier GPS
     */
    useEffect(() => {
        if (!order || status !== OrderStatus.Delivering) {
            locationSubscription.current?.remove();
            locationSubscription.current = null;
            return;
        }

        let cancelled = false;

        const sendLocation = async (latitude: number, longitude: number) => {
            const connection = connectionRef.current;

            if (
                connection &&
                connection.state === HubConnectionState.Connected
            ) {
                try {
                    await connection.invoke(
                        "UpdateOrderLocation",
                        order.id,
                        latitude,
                        longitude
                    );
                } catch (error) {
                    console.log("LOCATION SEND ERROR:", error);
                }
            }
        };

        const startTracking = async () => {
            const { status: permissionStatus } =
                await Location.requestForegroundPermissionsAsync();

            if (
                permissionStatus !== Location.PermissionStatus.GRANTED ||
                cancelled
            ) {
                return;
            }

            try {
                const currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

                if (cancelled) return;

                const latitude = currentLocation.coords.latitude;
                const longitude = currentLocation.coords.longitude;

                setCourierLocation({ latitude, longitude });
                await sendLocation(latitude, longitude);

                locationSubscription.current?.remove();

                locationSubscription.current =
                    await Location.watchPositionAsync(
                        {
                            accuracy: Location.Accuracy.High,
                            timeInterval: 3000,
                            distanceInterval: 5,
                        },
                        async (location) => {
                            if (cancelled) return;

                            const latitude = location.coords.latitude;
                            const longitude = location.coords.longitude;

                            setCourierLocation({ latitude, longitude });
                            await sendLocation(latitude, longitude);
                        }
                    );
            } catch (error) {
                console.log("GPS ERROR:", error);
            }
        };

        startTracking();

        return () => {
            cancelled = true;

            locationSubscription.current?.remove();
            locationSubscription.current = null;
        };
    }, [order?.id, status]);

    if (isLoading) {
        return (
            <View
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: theme.bg }}
            >
                <ActivityIndicator size="large" color={theme.green} />
            </View>
        );
    }

    if (!order) {
        return (
            <View
                className="flex-1 items-center justify-center px-8"
                style={{ backgroundColor: theme.bg }}
            >
                <Package size={42} color={theme.muted} />

                <Text
                    className="mt-4 text-center text-xl font-extrabold"
                    style={{ color: theme.text }}
                >
                    Немає поточного замовлення
                </Text>

                <Text
                    className="mt-2 text-center text-sm leading-5"
                    style={{ color: theme.muted }}
                >
                    Коли ви приймете замовлення, воно з&#39;явиться тут
                </Text>
            </View>
        );
    }

    const currentStatus = status ?? order.status;

    const isDelivering = currentStatus === OrderStatus.Delivering;
    const isCompleted = currentStatus === OrderStatus.Completed;
    const isCancelled = currentStatus === OrderStatus.Cancelled;

    const pickupAddress = order.affiliate.location.address;

    return (
        <View className="flex-1" style={{ backgroundColor: theme.bg }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="px-4 pb-24 pt-16"
            >
                {/* HEADER */}

                <View className="mb-5 flex-row items-center justify-between">
                    <View>
                        <Text
                            className="text-[25px] font-extrabold"
                            style={{ color: theme.text }}
                        >
                            Поточне замовлення
                        </Text>

                        <Text
                            className="mt-1 text-sm"
                            style={{ color: theme.muted }}
                        >
                            Замовлення #{order.id}
                        </Text>
                    </View>

                    <View
                        className="rounded-full px-3 py-2"
                        style={{
                            backgroundColor: getStatusColor(
                                currentStatus,
                                theme
                            ),
                        }}
                    >
                        <Text
                            className="text-xs font-bold"
                            style={{
                                color: getStatusTextColor(
                                    currentStatus,
                                    theme
                                ),
                            }}
                        >
                            {getStatusTitle(currentStatus)}
                        </Text>
                    </View>
                </View>

                {!isCompleted && !isCancelled && (
                    <StatusProgress status={currentStatus} theme={theme} />
                )}

                {isDelivering ? (
                    <DeliveryMap
                        order={order}
                        courierLocation={courierLocation}
                        theme={theme}
                    />
                ) : (
                    <PreparationCard
                        status={currentStatus}
                        pickupAddress={pickupAddress}
                        theme={theme}
                    />
                )}

                <RouteCard
                    order={order}
                    isDelivering={isDelivering}
                    theme={theme}
                />

                <PayoutCard order={order} theme={theme} />

                <CustomerCard order={order} theme={theme} />

                <Pressable
                    disabled={!isDelivering}
                    onPress={async () => {
                        try {
                            await confirmDelivery(order.id).unwrap();
                            dispatch(apiAccount.util.invalidateTags(["Account"]));
                        } catch (error) {
                            console.error("Order action error:", error);
                        }
                    }}
                    className="mb-4 h-14 items-center justify-center rounded-[18px]"
                    style={{
                        backgroundColor: isDelivering
                            ? theme.green
                            : theme.card2,
                        opacity: isDelivering ? 1 : 0.6,
                    }}
                >
                    <Text
                        className="text-base font-extrabold"
                        style={{
                            color: isDelivering ? "#FFFFFF" : theme.muted,
                        }}
                    >
                        Замовлення доставлено
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

/* ================= STATUS ================= */

function StatusProgress({
                            status,
                            theme,
                        }: {
    status: OrderStatus;
    theme: any;
}) {
    const steps = [
        {
            status: OrderStatus.Created,
            title: "Замовлення створено",
            icon: Package,
        },
        {
            status: OrderStatus.Cooking,
            title: "Готується",
            icon: ChefHat,
        },
        {
            status: OrderStatus.WaitingCourier,
            title: "Готове до видачі",
            icon: Store,
        },
        {
            status: OrderStatus.Delivering,
            title: "Доставка",
            icon: Truck,
        },
    ];

    const currentIndex =
        status === OrderStatus.Scheduled
            ? 0
            : steps.findIndex((x) => x.status === status);

    return (
        <View
            className="mb-4 rounded-[20px] border p-4"
            style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
            }}
        >
            {steps.map((step, index) => {
                const Icon = step.icon;

                const active = index <= currentIndex;

                return (
                    <View
                        key={step.status}
                        className="min-h-[38px] flex-row items-center"
                    >
                        <View
                            className="h-[34px] w-[34px] items-center justify-center rounded-full"
                            style={{
                                backgroundColor: active
                                    ? theme.greenBg
                                    : theme.card2,
                            }}
                        >
                            <Icon
                                size={18}
                                color={active ? theme.green : theme.muted}
                            />
                        </View>

                        <Text
                            className="ml-3 text-sm font-semibold"
                            style={{
                                color: active ? theme.text : theme.muted,
                            }}
                        >
                            {step.title}
                        </Text>

                        {index < steps.length - 1 && (
                            <View
                                className="absolute left-[16px] top-[34px] h-5 w-[2px]"
                                style={{
                                    backgroundColor:
                                        index < currentIndex
                                            ? theme.green
                                            : theme.border,
                                }}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
}

/* ================= PREPARATION ================= */

function PreparationCard({
                             status,
                             pickupAddress,
                             theme,
                         }: {
    status: OrderStatus;
    pickupAddress: string;
    theme: any;
}) {
    const waiting = status === OrderStatus.WaitingCourier;

    return (
        <View
            className="mb-4 rounded-[22px] border p-5"
            style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
            }}
        >
            <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-[20px]"
                style={{
                    backgroundColor: waiting ? theme.greenBg : theme.orangeBg,
                }}
            >
                {waiting ? (
                    <Package size={32} color={theme.green} />
                ) : (
                    <ChefHat size={32} color={theme.orange} />
                )}
            </View>

            <Text
                className="text-[21px] font-extrabold"
                style={{ color: theme.text }}
            >
                {waiting ? "Замовлення готове" : "Замовлення готується"}
            </Text>

            <Text
                className="mb-[18px] mt-2 text-sm leading-[21px]"
                style={{ color: theme.muted }}
            >
                {waiting
                    ? "Під'їдьте до закладу та заберіть замовлення."
                    : "Під'їдьте до закладу та очікуйте приготування замовлення."}
            </Text>

            <View
                className="flex-row items-center gap-3 rounded-2xl p-3.5"
                style={{ backgroundColor: theme.card2 }}
            >
                <MapPin size={20} color={theme.green} />

                <View className="flex-1">
                    <Text
                        className="mb-1 text-[10px] font-extrabold"
                        style={{ color: theme.muted }}
                    >
                        ЗАКЛАД
                    </Text>

                    <Text
                        className="text-sm font-semibold"
                        style={{ color: theme.text }}
                    >
                        {pickupAddress}
                    </Text>
                </View>
            </View>
        </View>
    );
}

/* ================= MAP (Leaflet + OpenStreetMap) ================= */

function DeliveryMap({
                         order,
                         courierLocation,
                         theme,
                     }: {
    order: IOrder;
    courierLocation: Coordinates | null;
    theme: any;
}) {
    const webRef = useRef<WebView>(null);
    const loadedRef = useRef(false);

    const customer = parseCoordinates(order.userLocation.location);

    const html = useMemo(() => {
        if (!customer) return "";

        return `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{height:100%;margin:0;padding:0}</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map',{zoomControl:false}).setView([${customer.latitude},${customer.longitude}],15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,
  attribution:'© OpenStreetMap'
}).addTo(map);

var ICON_PIN = '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>';
var ICON_TRUCK = '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>';

function icon(color, svgPaths){
  return L.divIcon({
    className:'',
    html:'<div style="width:38px;height:38px;border-radius:50%;background:'+color+';border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center">' +
         '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + svgPaths + '</svg>' +
         '</div>',
    iconSize:[38,38],
    iconAnchor:[19,19]
  });
}

L.marker([${customer.latitude},${customer.longitude}],{icon:icon('${theme.red}', ICON_PIN)}).addTo(map);

var CLAT = ${customer.latitude}, CLNG = ${customer.longitude};
var courier = null, line = null, lastFetch = 0;

function drawRoute(points){
  if(!line){
    line = L.polyline(points,{color:'${theme.green}',weight:5,opacity:0.9}).addTo(map);
  } else {
    line.setLatLngs(points);
  }
  map.fitBounds(line.getBounds(),{padding:[50,50],animate:true});
}

window.updateCourier = function(lat,lng){
  if(!courier){
    courier = L.marker([lat,lng],{icon:icon('${theme.green}', ICON_TRUCK)}).addTo(map);
  } else {
    courier.setLatLng([lat,lng]);
  }

  // Не частіше ніж раз на 10 секунд, щоб не навантажувати сервіс маршрутів
  var now = Date.now();
  if(line && now - lastFetch < 10000){ return; }
  lastFetch = now;

  // Спочатку проста лінія, поки вантажиться маршрут
  if(!line){ drawRoute([[lat,lng],[CLAT,CLNG]]); }

  var url = 'https://router.project-osrm.org/route/v1/driving/' +
    lng + ',' + lat + ';' + CLNG + ',' + CLAT +
    '?overview=full&geometries=geojson';

  fetch(url)
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d && d.routes && d.routes[0]){
        var pts = d.routes[0].geometry.coordinates.map(function(c){
          return [c[1], c[0]];
        });
        drawRoute(pts);
      }
    })
    .catch(function(){});
};
</script>
</body>
</html>`;
    }, [customer?.latitude, customer?.longitude, theme.red, theme.green]);

    const sendCourier = (loc: Coordinates | null) => {
        if (!loc || !loadedRef.current) return;

        webRef.current?.injectJavaScript(
            `window.updateCourier(${loc.latitude},${loc.longitude});true;`
        );
    };

    useEffect(() => {
        sendCourier(courierLocation);
    }, [courierLocation]);

    if (!customer) {
        return (
            <View
                className="mb-4 rounded-[22px] border p-5"
                style={{
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                }}
            >
                <CircleAlert size={30} color={theme.orange} />

                <Text
                    className="mt-3 text-xl font-extrabold"
                    style={{ color: theme.text }}
                >
                    Не вдалося визначити координати
                </Text>
            </View>
        );
    }

    return (
        <View
            className="mb-4 overflow-hidden rounded-[22px] border"
            style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
            }}
        >
            <View className="flex-row items-center justify-between p-4">
                <View className="flex-1">
                    <Text
                        className="text-lg font-extrabold"
                        style={{ color: theme.text }}
                    >
                        Доставка клієнту
                    </Text>

                    <Text
                        className="mt-1 text-xs"
                        style={{ color: theme.muted }}
                    >
                        Геопозиція оновлюється в реальному часі
                    </Text>
                </View>

                <Navigation size={22} color={theme.green} />
            </View>

            <View style={{ height: 310, width: "100%" }}>
                <WebView
                    ref={webRef}
                    originWhitelist={["*"]}
                    source={{ html }}
                    javaScriptEnabled
                    domStorageEnabled
                    nestedScrollEnabled
                    scrollEnabled={false}
                    onLoadEnd={() => {
                        loadedRef.current = true;
                        sendCourier(courierLocation);
                    }}
                />
            </View>
        </View>
    );
}

/* ================= ROUTE ================= */

function RouteCard({
                       order,
                       isDelivering,
                       theme,
                   }: {
    order: IOrder;
    isDelivering: boolean;
    theme: any;
}) {
    return (
        <View
            className="mb-4 rounded-[20px] border p-4"
            style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
            }}
        >
            <Text
                className="mb-4 text-[17px] font-extrabold"
                style={{ color: theme.text }}
            >
                Маршрут
            </Text>

            <RouteItem
                icon={Store}
                title="Забрати"
                value={order.affiliate.location.address}
                theme={theme}
                active={!isDelivering}
            />

            <View
                className="my-1 ml-5 h-[22px] w-[2px]"
                style={{ backgroundColor: theme.border }}
            />

            <RouteItem
                icon={MapPin}
                title="Доставити"
                value={order.userLocation.address}
                theme={theme}
                active={isDelivering}
            />
        </View>
    );
}

function RouteItem({ icon: Icon, title, value, theme, active }: any) {
    return (
        <View className="flex-row items-center gap-3">
            <View
                className="h-[42px] w-[42px] items-center justify-center rounded-[14px]"
                style={{
                    backgroundColor: active ? theme.greenBg : theme.card2,
                }}
            >
                <Icon size={19} color={active ? theme.green : theme.muted} />
            </View>

            <View className="flex-1">
                <Text
                    className="mb-0.5 text-[10px] font-extrabold uppercase"
                    style={{ color: theme.muted }}
                >
                    {title}
                </Text>

                <Text
                    className="text-sm font-semibold"
                    style={{ color: theme.text }}
                >
                    {value}
                </Text>
            </View>
        </View>
    );
}

/* ================= PAYOUT ================= */

function PayoutCard({ order, theme }: { order: IOrder; theme: any }) {
    const payout = order.deliveryFee + order.tipAmount;

    return (
        <View
            className="mb-4 flex-row items-center justify-between rounded-[20px] p-[18px]"
            style={{ backgroundColor: theme.greenBg }}
        >
            <View>
                <Text
                    className="text-[10px] font-extrabold"
                    style={{ color: theme.muted }}
                >
                    ВАША ВИНАГОРОДА
                </Text>

                <Text
                    className="mt-1 text-[28px] font-black"
                    style={{ color: theme.green }}
                >
                    {payout.toFixed(2)} ₴
                </Text>
            </View>

            <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: theme.green }}
            >
                <Truck size={22} color="#FFFFFF" />
            </View>
        </View>
    );
}

/* ================= CUSTOMER ================= */

function CustomerCard({ order, theme }: { order: IOrder; theme: any }) {
    const handleCall = async () => {
        const phone = order.user.phone?.replace(/\s+/g, "");

        if (!phone) {
            return;
        }

        try {
            await Linking.openURL(`tel:${phone}`);
        } catch (error) {
            console.error("CALL ERROR:", error);
        }
    };

    return (
        <View
            className="mb-4 rounded-[20px] border p-4"
            style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
            }}
        >
            <Text
                className="mb-4 text-[17px] font-extrabold"
                style={{ color: theme.text }}
            >
                Клієнт
            </Text>

            <View className="flex-row items-center gap-3">
                <View
                    className="h-[46px] w-[46px] items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.card2 }}
                >
                    <Text
                        className="text-lg font-extrabold"
                        style={{ color: theme.text }}
                    >
                        {order.user.firstName?.[0]}
                    </Text>
                </View>

                <View className="flex-1">
                    <Text
                        className="text-[15px] font-bold"
                        style={{ color: theme.text }}
                    >
                        {order.user.firstName} {order.user.lastName}
                    </Text>

                    <Text
                        className="mt-0.5 text-xs"
                        style={{ color: theme.muted }}
                    >
                        {order.userLocation.address}
                    </Text>
                </View>

                <Pressable
                    onPress={handleCall}
                    className="h-[42px] w-[42px] items-center justify-center rounded-[14px]"
                    style={{ backgroundColor: theme.greenBg }}
                >
                    <Phone size={19} color={theme.green} />
                </Pressable>
            </View>
        </View>
    );
}


/* ================= HELPERS ================= */

function parseCoordinates(value?: string | null): Coordinates | null {
    if (!value) return null;

    const [lat, lng] = value.split(",").map((x) => Number(x.trim()));

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
    }

    return {
        latitude: lat,
        longitude: lng,
    };
}

function getStatusTitle(status: OrderStatus) {
    switch (status) {
        case OrderStatus.Created:
            return "Створено";

        case OrderStatus.Scheduled:
            return "Заплановано";

        case OrderStatus.Cooking:
            return "Готується";

        case OrderStatus.WaitingCourier:
            return "Готове";

        case OrderStatus.Delivering:
            return "Доставка";

        case OrderStatus.Completed:
            return "Завершено";

        case OrderStatus.Cancelled:
            return "Скасовано";

        default:
            return "Невідомо";
    }
}

function getStatusColor(status: OrderStatus, theme: any) {
    if (status === OrderStatus.Cancelled) {
        return theme.redBg;
    }

    if (status === OrderStatus.Completed) {
        return theme.greenBg;
    }

    return theme.card2;
}

function getStatusTextColor(status: OrderStatus, theme: any) {
    if (status === OrderStatus.Cancelled) {
        return theme.red;
    }

    if (status === OrderStatus.Completed) {
        return theme.green;
    }

    return theme.text;
}