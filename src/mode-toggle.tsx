import { useTheme } from "next-themes";
import { Classic } from "../src/theme-toggle";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Classic
      onClick={() =>
        setTheme(theme === "dark" ? "light" : "dark")
      }
      className="cursor-pointer"
    />
  );
}