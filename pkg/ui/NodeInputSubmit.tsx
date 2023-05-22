import { getNodeLabel } from "@ory/integrations/ui"
import { Button } from "@ory/themes"

import { NodeInputProps } from "./helpers"
import { MiscInfo } from "@/services/basic-fetch/misc";


export function NodeInputSubmit<T>({
  node,
  attributes,
  disabled,
}: NodeInputProps) {
  return (
    <>
      {node.meta.label?.text == "Sign up" ? (<>
        {MiscInfo.isManaged ? (<>
          <div className="info-containter">
            <span>Once you register for an account, we’ll set up an organization for you - this is a manual step, but it usually only takes minutes.</span>
            <div>We’ll get back to you as soon as possible.</div>
          </div>
        </>) : (<>
          <div className="info-containter">
            <span>This sets up a single-user account on your local machine.</span>
            <div> If you want to use a hosted version with GPU acceleration, multi-user capabilities and additional features, check out our hostings.</div>
          </div></>)}
      </>) : (<> </>)}

      <Button
        id="submit"
        name={attributes.name}
        value={attributes.value || ""}
        disabled={attributes.disabled || disabled}
      >
        {getNodeLabel(node)}
      </Button>
    </>
  )
}
