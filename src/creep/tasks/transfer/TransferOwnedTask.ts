import Task from "../Task";
import makeTransferTask from "./MakeTransferTask";

const TransferOwnedTask: Task = {
  id: "transfer_owned" as Id<Task>,
  displayName: "Transfer to owned",

  steps: makeTransferTask(structure => structure.my)
};

export default TransferOwnedTask;
