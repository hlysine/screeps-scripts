import Task from "../Task";
import makeTransferTask from "./MakeTransferTask";

const TransferTask: Task = {
  id: "transfer" as Id<Task>,
  displayName: "Transfer",

  steps: makeTransferTask(() => true)
};

export default TransferTask;
