export const getStatusStyle = (status) => {
  switch (status) {
    case "paid":
      return {
        backgroundColor: "#dbeafe",
        color: "#1d4ed8",
        label: "Төлбөр баталгаажсан"
      };
    case "completed":
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
        label: "Хүргэлт дууссан"
      };
    case "cancelled":
      return {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        label: "Цуцлагдсан"
      };
    case "pending":
    default:
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        label: "Хүлээгдэж байна"
      };
  }
};
