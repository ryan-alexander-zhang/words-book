import { Action, ActionPanel, Form, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { addWord } from "./lib/api";

export default function AddWord() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: { word: string }) => {
    const trimmed = values.word.trim();
    if (!trimmed) {
      await showToast({
        style: Toast.Style.Failure,
        title: "请输入单词"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addWord(trimmed);
      await showToast({
        style: Toast.Style.Success,
        title: "已添加到生词本"
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "添加失败",
        message: error instanceof Error ? error.message : "未知错误"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="添加" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isSubmitting}
    >
      <Form.TextField id="word" title="单词" placeholder="输入单词" />
    </Form>
  );
}

