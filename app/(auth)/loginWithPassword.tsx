import {
    View,
    Text,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform, ActivityIndicator
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { router } from "expo-router";
import {AuthHero} from "@/components/ui/custom/authHero";
import {AuthCard} from "@/components/ui/custom/authCard";
import {CircleAlert, Loader} from "lucide-react-native";
import {useLoginMutation} from "@/store/service/apiAccount";
import {IAuthLogin} from "@/types/auth/IAuthLogin";
import {Controller, useForm} from "react-hook-form";
import {AlertDescription, AlertTitle, Alert} from "@/components/ui/alert";
import {saveSecureStore} from "@/utils/secureStore";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [login, {isLoading, isError}] = useLoginMutation();

    const loginSubmit = async (data: IAuthLogin) => {
        try {
            const res = await login(data).unwrap();
            saveSecureStore("accessToken", res.accessToken);
            saveSecureStore("refreshToken", res.refreshToken);
            router.replace("/(main)/test");
        } catch {}
    }

    const {handleSubmit, control, formState: { errors }} = useForm<IAuthLogin>();

    return (
        <View className="flex-1 bg-white dark:bg-[#0B0D0F]">
            {/* Hero — залишається на місці */}
            <AuthHero />


            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                    Platform.OS === "ios" ? "interactive" : "on-drag"
                }
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: 278,
                    paddingBottom: 120,
                }}
                className={"z-10"}
            >
                <AuthCard>
                    {/* Heading */}
                    <View className="items-center">
                        <Text className="text-[29px] font-nunito-extrabold tracking-tight text-neutral-950 dark:text-white">
                            Вітаємо!
                        </Text>

                        <Text className="mt-1 text-center text-[15px] text-neutral-500 dark:text-[#8B9298]">
                            Увійдіть в акаунт
                        </Text>
                    </View>

                    {/* Email */}
                    <View className="mt-7">
                        {isError && (
                            <Alert icon={CircleAlert} variant={"destructive"} className={"mb-5"}>
                                <AlertTitle>Невірна пошта або пароль</AlertTitle>
                            </Alert>
                        )}

                        <View className="mb-1 flex-row">
                            <Text className="text-sm font-nunito-semibold text-neutral-700 dark:text-[#D8DDE1]">
                                Email
                            </Text>
                        </View>

                        <Controller
                            name="email"
                            control={control}
                            rules={{
                                required: "Електронна пошта обов'язкова",
                            }}
                            render={({field: {onChange, onBlur, value}}) => (
                                <>
                                    <Input
                                        className={`min-h-14 flex-1 bg-white px-4 text-neutral-950 dark:bg-[#1B1F23] dark:text-white ${
                                            errors.email
                                                ? "border-red-400 dark:border-red-500"
                                                : "border-neutral-200 dark:border-[#292E33]"
                                        }`}
                                        keyboardType="email-address"
                                        placeholder="example@gmail.com"
                                        placeholderTextColor="#A3A3A3"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        returnKeyType="next"
                                        onChangeText={onChange}
                                        onBlur={onBlur}
                                        value={value}
                                    />

                                    {errors.email && (
                                        <View className="mt-1 flex-row items-center">
                                            <Text className="mr-1 text-xs font-nunito-semibold text-red-500">
                                                !
                                            </Text>
                                            <Text className="text-xs font-nunito-semibold text-red-500">
                                                {errors.email.message}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                        />
                    </View>

                    {/* Password */}
                    <View className="mt-3">
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
                                        secureTextEntry={true}
                                        returnKeyType="done"
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
                    </View>

                    {/* Continue */}
                    <Button onPress={isLoading ? () => {} : handleSubmit(loginSubmit)} className="mt-4 h-14 rounded-full flex justify-center items-center bg-[#00A082] dark:bg-[#00A082] dark:active:bg-[#00A082]/30 transition duration-200">
                        {isLoading ? (
                            <ActivityIndicator className={"text-white dark:text-[#0B0D0F]"} size={"small"}/>
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

                    {/* Login with code */}
                    <Pressable
                        onPress={() => router.push("/(auth)/login")}
                        className="h-14 flex-row items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-[#30363B] dark:bg-[#1B1F23]"
                    >
                        <Text className="text-[16px] font-nunito-bold text-neutral-900 dark:text-[#F2F4F5]">
                            Увійти/зареєструватися з кодом
                        </Text>
                    </Pressable>

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
        </View>
    );
}
