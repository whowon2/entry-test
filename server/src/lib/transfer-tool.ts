import { FunctionDeclarationsTool, SchemaType } from "@google/generative-ai";

export const transferTool: FunctionDeclarationsTool = {
  functionDeclarations: [
    {
      name: "transfer_customer",
      description:
        "Finalize the triage and transfer the customer to a human agent.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          department: {
            format: "enum",
            type: SchemaType.STRING,
            enum: ["SALES", "SUPPORT", "FINANCIAL"],
            description: "The department to transfer the user to.",
          },
          summary: {
            type: SchemaType.STRING,
            description:
              "A concise summary of the user's request and data collected.",
          },
        },
        required: ["department", "summary"],
      },
    },
  ],
};
