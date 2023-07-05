import { TextInput } from "@ory/themes"

import { NodeInputProps } from "./helpers"
import { getNodeLabel } from "@ory/integrations/ui"
import { Message } from "./Messages"

export function NodeInputDefault<T>(props: NodeInputProps) {
  const { node, attributes, value = "", setValue, disabled } = props

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

  // Render a generic text input field.
  return (
    <TextInput
      title={node.meta.label?.text + (node.meta.label ? "*" : "")}
      onClick={onClick}
      onChange={(e) => {
        setValue(e.target.value)
      }}
      className={"text-input" + (props.visible ? "" : " hidden")}
      type={attributes.type}
      name={attributes.name}
      placeholder={getNodeLabel(node)}
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
