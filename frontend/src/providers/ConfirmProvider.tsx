import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

type ConfirmTone = "default" | "danger";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  requireTextConfirm?: string;
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
  resolve?: (value: boolean) => void;
};

type ConfirmApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmApi | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
  });
  const [confirmInput, setConfirmInput] = useState("");

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmInput("");
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    state.resolve?.(value);
    setState((prev) => ({ ...prev, open: false }));
  };

  const required = state.requireTextConfirm;
  const confirmDisabled = required
    ? confirmInput.trim().toLowerCase() !== required.toLowerCase()
    : false;

  const api = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={api}>
      {children}
      <Modal
        open={state.open}
        title={state.title}
        description={state.description}
        onClose={() => handleClose(false)}
        tone={state.tone === "danger" ? "danger" : "default"}
        footer={
          <>
            <Button tone="secondary" onClick={() => handleClose(false)}>
              {state.cancelText ?? "Cancel"}
            </Button>
            <Button
              tone={state.tone === "danger" ? "danger" : "primary"}
              onClick={() => handleClose(true)}
              disabled={confirmDisabled}
            >
              {state.confirmText ?? "Confirm"}
            </Button>
          </>
        }
      >
        {required && (
          <div className="mt-3">
            <Input
              label={`Type "${required}" to confirm`}
              value={confirmInput}
              onChange={(event) => setConfirmInput(event.target.value)}
            />
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
