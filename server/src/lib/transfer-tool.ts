import { FunctionDeclaration, Type } from "@google/genai";

export const transferTool: FunctionDeclaration = {
  name: "transfer_customer",
  description:
    "Finalize the triage and transfer the customer to a human agent.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      department: {
        type: Type.STRING,
        enum: ["SALES", "SUPPORT", "FINANCIAL"],
        description: "The department to transfer the user to.",
      },
      summary: {
        type: Type.STRING,
        description:
          "A concise summary of the user's request and data collected.",
      },
    },
    required: ["department", "summary"],
  },
};
