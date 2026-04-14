export const colors = {
  background: "#f4efe6",
  surface: "#fffaf2",
  surfaceStrong: "#ffffff",
  surfaceMuted: "#ede3d2",
  text: "#1f2937",
  textMuted: "#6b7280",
  textSoft: "#9ca3af",
  primary: "#9a3412",
  primaryDark: "#7c2d12",
  accent: "#164e63",
  success: "#166534",
  warning: "#92400e",
  danger: "#b91c1c",
  border: "#e7dcc8"
};

export const shadow = {
  shadowColor: "#2a2116",
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3
};

export const screen = {
  flex: 1,
  backgroundColor: colors.background
};

export const content = {
  padding: 20,
  paddingTop: 28,
  paddingBottom: 36
};

export const card = {
  backgroundColor: colors.surfaceStrong,
  borderRadius: 24,
  padding: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadow
};

export const sectionTitle = {
  fontSize: 24,
  fontWeight: "800",
  color: colors.text
};

export const input = {
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: "#fffdf9",
  color: colors.text,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontSize: 16
};

export const primaryButton = {
  backgroundColor: colors.primary,
  borderRadius: 16,
  paddingVertical: 15,
  alignItems: "center",
  justifyContent: "center"
};

export const secondaryButton = {
  backgroundColor: colors.surfaceMuted,
  borderRadius: 16,
  paddingVertical: 15,
  alignItems: "center",
  justifyContent: "center"
};

export const buttonText = {
  color: "white",
  fontSize: 16,
  fontWeight: "800"
};

export const secondaryButtonText = {
  color: colors.text,
  fontSize: 16,
  fontWeight: "800"
};

export const formatCurrency = (value) => `${Number(value || 0).toLocaleString()}₮`;

export const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};
