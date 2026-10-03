export const PRIMARY = "#FFC244"; // жовтий (як у профілі)
export const GREEN = "#0B6B3E";   // кнопки "Кошик", "Додати", "Перейти до оплати"
export const RED = "#E4262C";     // бейдж знижки, "Обов'язково"

// На скріншотах валюта показана як "$". Змініть на "₴" для гривні.
export const CURRENCY = "₴";

export const money = (value: number) =>
    `${value.toFixed(2).replace(".", ",")} ${CURRENCY}`;
