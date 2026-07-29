export type AlertData = {
  message: string;
  type?: "success" | "failure";
  confirm?: boolean;
  onConfirm?: () => void;
};
