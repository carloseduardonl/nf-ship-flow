import { createContext, useContext, useState, ReactNode } from "react";

interface DeliveryFormData {
  // Step 1 - NF Data
  nfNumber: string;
  nfSeries: string;
  nfDate: Date | undefined;
  nfValue: number;
  nfFileUrl: string;
  nfFileName: string;

  // Step 2 - Delivery Data (to be added)
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostalCode?: string;
  proposedDate?: Date;
  proposedTimeStart?: string;
  proposedTimeEnd?: string;

  // Step 3 - Buyer Selection (to be added)
  buyerCompanyId?: string;
  notes?: string;
}

interface DeliveryFormContextType {
  formData: DeliveryFormData;
  updateFormData: (data: Partial<DeliveryFormData>) => void;
  resetForm: () => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const initialFormData: DeliveryFormData = {
  nfNumber: "",
  nfSeries: "",
  nfDate: undefined,
  nfValue: 0,
  nfFileUrl: "",
  nfFileName: "",
};

const DeliveryFormContext = createContext<DeliveryFormContextType | undefined>(
  undefined
);

export function DeliveryFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<DeliveryFormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);

  const updateFormData = (data: Partial<DeliveryFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
  };

  return (
    <DeliveryFormContext.Provider
      value={{ formData, updateFormData, resetForm, currentStep, setCurrentStep }}
    >
      {children}
    </DeliveryFormContext.Provider>
  );
}

export function useDeliveryForm() {
  const context = useContext(DeliveryFormContext);
  if (!context) {
    throw new Error("useDeliveryForm must be used within DeliveryFormProvider");
  }
  return context;
}
