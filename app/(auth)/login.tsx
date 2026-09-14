import {
    View,
    Text,
    Pressable,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    ActivityIndicator,
    Animated
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router } from 'expo-router';
import {AuthHero} from "@/components/ui/custom/authHero";
import {AuthCard} from "@/components/ui/custom/authCard";
import {useRegisterMutation, useSendCodeMutation, useVerifyCodeMutation} from "@/store/service/apiAccount";
import {useRef, useState} from "react";
import {ApiError} from "@/types/api/ApiError";
import {saveSecureStore} from "@/utils/secureStore";
import {Controller, useForm} from "react-hook-form";
import {IAuthRegister} from "@/types/auth/IAuthRegister";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [sendCode, {isLoading: isSending}] = useSendCodeMutation();
    const [verifyCode, {isLoading: isVerifing}] = useVerifyCodeMutation();
    const [register, {isLoading: isRegistering}] = useRegisterMutation();

    const [stage, setStage] = useState<"email" | "verifyCode" | "registration">("email");

    const stageOpacity = useRef(new Animated.Value(1)).current;
    const stageTranslate = useRef(new Animated.Value(0)).current;

    const changeStage = (nextStage: "email" | "verifyCode" | "registration") => {
        if (nextStage === stage) return;

        Animated.parallel([
            Animated.timing(stageOpacity, {
                toValue: 0,
                duration: 120,
                useNativeDriver: true,
            }),
            Animated.timing(stageTranslate, {
                toValue: -15,
                duration: 120,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setStage(nextStage);

            stageTranslate.setValue(15);

            Animated.parallel([
                Animated.timing(stageOpacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(stageTranslate, {
                    toValue: 0,
                    friction: 8,
                    tension: 70,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const [email, setEmail] = useState<string>("");
    const [emailError, setEmailError] = useState("");

    const [code, setCode] = useState<string>("");
    const [codeError, setCodeError] = useState<string>("");

    const sendCodeSubmit = async () => {
        setEmailError("");

        const value = email.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value) {
            setEmailError("Введіть електронну пошту");
            return;
        }

        if (!emailRegex.test(value)) {
            setEmailError("Введіть коректну електронну пошту");
            return;
        }

        try {
            await sendCode(value).unwrap();

            setCode("");
            setCodeError("");

            changeStage("verifyCode");
        } catch (error: any) {
            const errors = error?.data?.errors;

            if (!Array.isArray(errors)) {
                setEmailError("Невдалося відправити лист");
                return;
            }

            errors.forEach((err: ApiError) => {
                if (err.field === "CodeAlreadySended") {
                    setEmailError("");
                    changeStage("verifyCode");
                }
            });
        }
    }

    const verifyCodeSubmit = async () => {
        setCodeError("");

        const value = code.trim();

        try {
            const res = await verifyCode({
                email: email.trim(),
                code: value,
            }).unwrap();

            if (res.requiresRegistration) {
                console.log(res);
                saveSecureStore("accessToken", res.accessToken);
                changeStage("registration");
            } else {
                saveSecureStore("accessToken", res.accessToken);
                saveSecureStore("refreshToken", res.refreshToken);
                router.replace("/(main)/test");
            }
        } catch (error: any) {
            const errors = error?.data?.errors;

            if (!Array.isArray(errors)) {
                setCodeError("Помилка сервера");
                return;
            }

            errors.forEach((err: ApiError) => {
                if (err.field === "BadCode") {
                    setCodeError("Невірний код");
                }

                if (err.field === "ExpiredCode") {
                    setEmailError("Термін дії коду вийшов, спробуйте ще раз");
                    changeStage("email");
                }
            });
        }
    }

    const registerSubmit = async (data: IAuthRegister) => {
        try {
            console.log(data);

            const res = await register(data).unwrap();

            saveSecureStore("accessToken", res.accessToken);
            saveSecureStore("refreshToken", res.refreshToken);

            router.replace("/(main)/test");
        } catch (e) {
            console.error(e);
        }
    }

    const {handleSubmit, control, formState: { errors }} = useForm<IAuthRegister>();

    return (
        <View className="flex-1 bg-white dark:bg-[#0B0D0F]">

            <AuthHero />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingTop: 278,
                        paddingBottom: 20,
                    }}
                    className="z-10"
                >
                    <AuthCard>

                        <Animated.View
                            style={{
                                opacity: stageOpacity,
                                transform: [
                                    {
                                        translateX: stageTranslate
                                    }
                                ]
                            }}
                        >

                            {stage === "email" && (
                                <>
                                    {/* Heading */}
                                    <View className="items-center">
                                        <Text className="text-[29px] font-nunito-extrabold tracking-tight text-neutral-950 dark:text-white">
                                            Вітаємо!
                                        </Text>

                                        <Text className="mt-1 text-center text-[15px] text-neutral-500 dark:text-[#8B9298]">
                                            Почнемо з email
                                        </Text>
                                    </View>

                                    {/* Email */}
                                    <View className="mt-7">
                                        <View className="mb-2 flex-row">
                                            <Text className="text-sm font-nunito-semibold text-neutral-700 dark:text-[#D8DDE1]">
                                                Email
                                            </Text>
                                        </View>

                                        <Input
                                            className="min-h-14 flex-1 border-neutral-200 bg-white px-4 text-neutral-950 dark:border-[#292E33] dark:bg-[#1B1F23] dark:text-white"
                                            keyboardType="email-address"
                                            placeholder="example@gmail.com"
                                            placeholderTextColor="#A3A3A3"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            returnKeyType="next"
                                            value={email}
                                            onChangeText={(e) => setEmail(e)}
                                        />

                                        {emailError && (
                                            <View className="mt-1 flex-row items-center">
                                                <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                                    !
                                                </Text>

                                                <Text className="text-xs font-nunito-semibold text-red-500">
                                                    {emailError}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Continue */}
                                    <Button
                                        onPress={isSending ? () => {} : sendCodeSubmit}
                                        className="mt-4 h-14 rounded-full flex justify-center items-center bg-[#00A082] dark:bg-[#00A082] dark:active:bg-[#00A082]/30 transition duration-200"
                                    >
                                        {isSending ? (
                                            <ActivityIndicator
                                                className={"text-white dark:text-[#0B0D0F]"}
                                                size={"small"}
                                            />
                                        ) : (
                                            <Text className="text-[16px] font-nunito-bold text-white">
                                                Продовжити
                                            </Text>
                                        )}
                                    </Button>

                                    {/* Divider */}
                                    <View className="my-6 flex-row items-center">
                                        <View className="h-[1px] flex-1 bg-neutral-200 dark:bg-[#292E33]" />

                                        <Text className="mx-4 text-[14px] text-neutral-400 dark:text-[#686F76]">
                                            або
                                        </Text>

                                        <View className="h-[1px] flex-1 bg-neutral-200 dark:bg-[#292E33]" />
                                    </View>

                                    {/* Password */}
                                    <Pressable
                                        onPress={() => router.push('/(auth)/loginWithPassword')}
                                        className="h-14 flex-row items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-[#30363B] dark:bg-[#1B1F23]"
                                    >
                                        <Text className="text-[16px] font-nunito-bold text-neutral-900 dark:text-[#F2F4F5]">
                                            Увійти за допомогою пароля
                                        </Text>
                                    </Pressable>
                                </>
                            )}

                            {stage === "verifyCode" && (
                                <>
                                    {/* Heading */}
                                    <View className="items-center">
                                        <Text className="text-[29px] font-nunito-extrabold tracking-tight text-neutral-950 dark:text-white">
                                            Перевірте пошту!
                                        </Text>

                                        <Text className="mt-1 text-center text-[15px] text-neutral-500 dark:text-[#8B9298]">
                                            На вашу пошту прийшов лист з кодом
                                        </Text>
                                    </View>

                                    {/* Email */}
                                    <View className="mt-7">
                                        <View className="mb-2 flex-row">
                                            <Text className="text-sm font-nunito-semibold text-neutral-700 dark:text-[#D8DDE1]">
                                                Код
                                            </Text>
                                        </View>

                                        <Input
                                            className="min-h-14 flex-1 border-neutral-200 bg-white px-4 text-neutral-950 dark:border-[#292E33] dark:bg-[#1B1F23] dark:text-white"
                                            keyboardType="number-pad"
                                            placeholder="123456"
                                            placeholderTextColor="#A3A3A3"
                                            autoCapitalize="none"
                                            autoComplete="email-otp"
                                            returnKeyType="next"
                                            value={code}
                                            onChangeText={(e) => setCode(e)}
                                        />

                                        {codeError && (
                                            <View className="mt-1 flex-row items-center">
                                                <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                                    !
                                                </Text>

                                                <Text className="text-xs font-nunito-semibold text-red-500">
                                                    {codeError}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Continue */}
                                    <Button
                                        onPress={isVerifing ? () => {} : verifyCodeSubmit}
                                        className="mt-4 h-14 rounded-full flex justify-center items-center bg-[#00A082] dark:bg-[#00A082] dark:active:bg-[#00A082]/30 transition duration-200"
                                    >
                                        {isVerifing ? (
                                            <ActivityIndicator
                                                className={"text-white dark:text-[#0B0D0F]"}
                                                size={"small"}
                                            />
                                        ) : (
                                            <Text className="text-[16px] font-nunito-bold text-white">
                                                Продовжити
                                            </Text>
                                        )}
                                    </Button>

                                    {/* Back */}
                                    <Pressable
                                        onPress={() => changeStage("email")}
                                        className="mt-4 h-14 flex-row items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-[#30363B] dark:bg-[#1B1F23]"
                                    >
                                        <Text className="text-[16px] font-nunito-bold text-neutral-900 dark:text-[#F2F4F5]">
                                            Назад
                                        </Text>
                                    </Pressable>
                                </>
                            )}

                            {stage === "registration" && (
                                <>
                                    {/* Heading */}
                                    <View className="items-center">
                                        <Text className="text-[29px] w-[90%] font-nunito-extrabold tracking-tight leading-none text-center mt-1 text-neutral-950 dark:text-white">
                                            Ви ще не зареєстровані
                                        </Text>

                                        <Text className="mt-1 text-center text-[15px] text-neutral-500 dark:text-[#8B9298]">
                                            Заповність всі необхідні поля, щоб зареєструватись, та створити аккаунт
                                        </Text>
                                    </View>

                                    <View className={"w-full pr-3"}>
                                        <View className={"flex flex-row gap-3"}>

                                            {/* First Name */}
                                            <View className="mt-7 w-1/2">
                                                <View className="mb-1 flex-row">
                                                    <Text className="text-sm font-nunito-semibold text-neutral-700 dark:text-[#D8DDE1]">
                                                        Ім&#39;я
                                                    </Text>
                                                </View>

                                                <Controller
                                                    name="firstName"
                                                    control={control}
                                                    rules={{
                                                        required: "Ім'я обов'язкове",
                                                    }}
                                                    render={({field: {onChange, onBlur, value}}) => (
                                                        <>
                                                            <Input
                                                                className={`min-h-14 flex-1 bg-white px-4 text-neutral-950 dark:bg-[#1B1F23] dark:text-white ${
                                                                    errors.firstName
                                                                        ? "border-red-400 dark:border-red-500"
                                                                        : "border-neutral-200 dark:border-[#292E33]"
                                                                }`}
                                                                keyboardType="default"
                                                                placeholder="Vova"
                                                                placeholderTextColor="#A3A3A3"
                                                                autoCapitalize="words"
                                                                autoComplete="name"
                                                                returnKeyType="next"
                                                                onChangeText={onChange}
                                                                onBlur={onBlur}
                                                                value={value}
                                                            />

                                                            {errors.firstName && (
                                                                <View className="mt-1 flex-row items-center">
                                                                    <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                                                        !
                                                                    </Text>

                                                                    <Text className="text-xs font-nunito-semibold text-red-500">
                                                                        {errors.firstName.message}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </>
                                                    )}
                                                />
                                            </View>

                                            {/* Last Name */}
                                            <View className="mt-7 w-1/2">
                                                <View className="mb-1 flex-row">
                                                    <Text className="text-sm font-nunito-semibold text-neutral-700 dark:text-[#D8DDE1]">
                                                        Прізвище
                                                    </Text>
                                                </View>

                                                <Controller
                                                    name="lastName"
                                                    control={control}
                                                    rules={{
                                                        required: "Прізвище обов'язкове",
                                                    }}
                                                    render={({field: {onChange, onBlur, value}}) => (
                                                        <>
                                                            <Input
                                                                className={`min-h-14 flex-1 bg-white px-4 text-neutral-950 dark:bg-[#1B1F23] dark:text-white ${
                                                                    errors.lastName
                                                                        ? "border-red-400 dark:border-red-500"
                                                                        : "border-neutral-200 dark:border-[#292E33]"
                                                                }`}
                                                                keyboardType="default"
                                                                placeholder="Novak"
                                                                placeholderTextColor="#A3A3A3"
                                                                autoCapitalize="words"
                                                                autoComplete="name-family"
                                                                returnKeyType="next"
                                                                onChangeText={onChange}
                                                                onBlur={onBlur}
                                                                value={value}
                                                            />

                                                            {errors.lastName && (
                                                                <View className="mt-1 flex-row items-center">
                                                                    <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                                                        !
                                                                    </Text>

                                                                    <Text className="text-xs font-nunito-semibold text-red-500">
                                                                        {errors.lastName.message}
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </>
                                                    )}
                                                />
                                            </View>
                                        </View>
                                    </View>

                                    <View className="mt-2">
                                        <View className="mb-1 flex-row">
                                            <Text className="text-sm font-nunito-semibold text-neutral-700 dark:text-[#D8DDE1]">
                                                Пароль
                                            </Text>
                                        </View>

                                        <Controller
                                            name="password"
                                            control={control}
                                            rules={{
                                                required: "Пароль обов'язковий",
                                            }}
                                            render={({field: {onChange, onBlur, value}}) => (
                                                <>
                                                    <Input
                                                        className={`min-h-14 flex-1 bg-white px-4 text-neutral-950 dark:bg-[#1B1F23] dark:text-white ${
                                                            errors.password
                                                                ? "border-red-400 dark:border-red-500"
                                                                : "border-neutral-200 dark:border-[#292E33]"
                                                        }`}
                                                        keyboardType="visible-password"
                                                        placeholder="••••••••"
                                                        placeholderTextColor="#A3A3A3"
                                                        autoCapitalize="none"
                                                        autoComplete="password"
                                                        returnKeyType="next"
                                                        onChangeText={onChange}
                                                        onBlur={onBlur}
                                                        value={value}
                                                    />

                                                    {errors.password && (
                                                        <View className="mt-1 flex-row items-center">
                                                            <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                                                !
                                                            </Text>

                                                            <Text className="text-xs font-nunito-semibold text-red-500">
                                                                {errors.password.message}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </>
                                            )}
                                        />

                                        {codeError && (
                                            <View className="mt-1 flex-row items-center">
                                                <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                                    !
                                                </Text>

                                                <Text className="text-xs font-nunito-semibold text-red-500">
                                                    {codeError}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Continue */}
                                    <Button
                                        onPress={
                                            isRegistering
                                                ? () => {}
                                                : handleSubmit(registerSubmit)
                                        }
                                        className="mt-4 h-14 rounded-full flex justify-center items-center bg-[#00A082] dark:bg-[#00A082] dark:active:bg-[#00A082]/30 transition duration-200"
                                    >
                                        {isRegistering ? (
                                            <ActivityIndicator
                                                className={"text-white dark:text-[#0B0D0F]"}
                                                size={"small"}
                                            />
                                        ) : (
                                            <Text className="text-[16px] font-nunito-bold text-white">
                                                Зареєструватись
                                            </Text>
                                        )}
                                    </Button>

                                    {/* Back */}
                                    <Pressable
                                        onPress={() => changeStage("email")}
                                        className="mt-2 h-14 flex-row items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-[#30363B] dark:bg-[#1B1F23]"
                                    >
                                        <Text className="text-[16px] font-nunito-bold text-neutral-900 dark:text-[#F2F4F5]">
                                            Назад
                                        </Text>
                                    </Pressable>
                                </>
                            )}

                        </Animated.View>

                        {/* Terms */}
                        <View className="mt-4 px-1">
                            <Text className="text-center text-[11px] leading-4 text-neutral-400 dark:text-[#686F76]">
                                Продовжуючи, ви автоматично погоджуєтесь з{" "}
                                <Text className="underline dark:text-[#9CA3A8]">
                                    Умовами та положеннями
                                </Text>{" "}
                                та{" "}
                                <Text className="underline dark:text-[#9CA3A8]">
                                    Політикою конфіденційності
                                </Text>
                                .
                            </Text>
                        </View>

                    </AuthCard>
                </ScrollView>
            </ScrollView>
        </View>
    );
}