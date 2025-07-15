import { TextInput } from "@ory/themes"

import { NodeInputProps } from "./helpers"
import { getNodeLabel } from "@ory/integrations/ui"
import { Message } from "./Messages"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

export function NodeInputDefault<T>(props: NodeInputProps) {
  const { node, attributes, value = "", setValue, disabled } = props
  const { t } = useTranslation('settings');
  const [labelName, setLabelName] = useState<string>("");
  const [placeholderName, setPlaceholderName] = useState<string>("");


  // Some attributes have dynamic JavaScript - this is for example required for WebAuthn.
  const onClick = () => {
    // This section is only used for WebAuthn. The script is loaded via a <script> node
    // and the functions are available on the global window level. Unfortunately, there
    // is currently no better way than executing eval / function here at this moment.
    if (attributes.onclick) {
      const run = new Function(attributes.onclick)
      run()
    }
  }

  useEffect(() => {
    // The settings page needs translated placeholders.
    switch (getNodeLabel(node)) {
      case "E-Mail":
        setPlaceholderName(t('email'));
        break;
      case "First Name":
        setPlaceholderName(t('firstName'));
        break;
      case "Last Name":
        setPlaceholderName(t('lastName'));
        break;
      case "Password":
        setPlaceholderName(t('password'));
        break;
      default:
        setPlaceholderName(getNodeLabel(node));
    }
  }, [node, t]);

  useEffect(() => {
    // The settings page needs translated labels.
    switch (getNodeLabel(node)) {
      case "E-Mail":
        setLabelName(t('email'));
        break;
      case "First Name":
        setLabelName(t('firstName'));
        break;
      case "Last Name":
        setLabelName(t('lastName'));
        break;
      case "Password":
        setLabelName(t('password'));
        break;
      default:
        setLabelName(getNodeLabel(node));
    }
  }, [node, t]);

  // Render a generic text input field.
  return (
    <TextInput
      title={labelName + (node.meta.label ? "*" : "")}
      onClick={onClick}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      className={"text-input" + (props.visible ? "" : " hidden")}
      type={attributes.type}
      name={attributes.name}
      placeholder={placeholderName}
      value={value}
      disabled={attributes.disabled || disabled}
      help={node.messages.length > 0}
      state={
        node.messages.find(({ type }) => type === "error") ? "error" : undefined
      }
      subtitle={
        <>
          {node.messages.forEach((message: any) => (
            <Message message={message} />
          ))}
        </>
      }
      required={attributes.required}
    />
  )
}
