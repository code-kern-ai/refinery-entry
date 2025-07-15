import { getNodeLabel } from "@ory/integrations/ui"
import { Button } from "@ory/themes"

import { NodeInputProps } from "./helpers"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"


export function NodeInputSubmit<T>({
  node,
  attributes,
  disabled,
}: NodeInputProps) {
  const { t } = useTranslation('settings');
  const [buttonName, setButtonName] = useState<string>("");

  useEffect(() => {
    // The settings page needs translated labels.
    switch (getNodeLabel(node)) {
      case "Save":
        setButtonName(t('save'));
        break;
      default:
        setButtonName(getNodeLabel(node));
    }
  }, [node, t]);

  return (
    <>
      {node.meta.label?.text == "Sign up" ?
        <div className="info-containter">
          <span>Once you register for an account, we’ll set up an organization for you - this is a manual step, but it usually only takes minutes.</span>
          <div>We’ll get back to you as soon as possible.</div>
        </div> : <> </>}

      <Button
        name={attributes.name}
        value={attributes.value || ""}
        disabled={attributes.disabled || disabled}
      >
        {buttonName}
      </Button>
    </>
  )
}
