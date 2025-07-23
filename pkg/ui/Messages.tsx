import { displayMessage } from "@/util/helper-functions"
import { UiText } from "@ory/client"
import { Alert, AlertContent } from "@ory/themes"
import { useTranslation } from "react-i18next"

interface MessageProps {
  message: UiText
}

export const Message = ({ message }: MessageProps) => {
  const { i18n } = useTranslation();
  const language = i18n.language;

  return (
    <Alert severity={message.type === "error" ? "error" : "info"}>
      <AlertContent data-testid={`ui/message/${message.id}`} className={message.type == 'error' ? 'message error' : 'message success'}>
        {displayMessage(message, language)}
      </AlertContent>
    </Alert>
  )
}

interface MessagesProps {
  messages?: Array<UiText>
}

export const Messages = ({ messages }: MessagesProps) => {
  if (!messages) {
    // No messages? Do nothing.
    return null
  }

  return (
    <div>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </div>
  )
}
