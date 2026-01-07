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
        title: "Enter a word"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addWord(trimmed);
      await showToast({
        style: Toast.Style.Success,
        title: "Added to Words Book"
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Add failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      isLoading={isSubmitting}
    >
      <Form.TextField id="word" title="Word" placeholder="Enter a word" />
    </Form>
  );
}
