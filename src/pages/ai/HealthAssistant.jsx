import React from 'react';
import {
  Webchat,
  WebchatProvider,
  getClient,
} from '@botpress/webchat';

const HealthAssistant = () => {
  const client = getClient({
    clientId: "db5d7072-0246-43bb-b509-14e1d2d15530",
    hostUrl: "https://cdn.botpress.cloud/webchat/v2.4",
    messagingUrl: "https://messaging.botpress.cloud"
  });

  const configuration = {
    showPoweredBy: false,
    showConversationButton: false,
    enableReset: true,
    composerPlaceholder: "Start asking for help related to Diet, First Aid and Emergency...",
    botName: "DiGiHealth Assistant",
    botConversationDescription: "I am here to assist you with medical related queries",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    foregroundColor: "#000000",
    useSessionStorage: true,
    showCloseButton: false,
    hideWidget: true,
    disableAnimations: true,
    className: "health-assistant-chat",
    containerWidth: "100%",
    layoutWidth: "100%",
    layoutHeight: "100%",
    theme: {
      style: {
        background: "#ffffff",
        fontFamily: "ibm",
        headerBackground: "#0091ff",
        headerText: "#ffffff",
        botMessageBackground: "#f5f8ff",
        botMessageText: "#000000",
        userMessageBackground: "#0091ff",
        userMessageText: "#ffffff",
        borderRadius: "10px",
      }
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '1000px',
      margin: '20px auto',
      height: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <WebchatProvider client={client} configuration={configuration}>
        <div style={{
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'relative',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <Webchat />
        </div>
      </WebchatProvider>
      <style>
        {`
          .health-assistant-chat {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            border-radius: 10px !important;
            border: none !important;
            background: #ffffff !important;
          }
          .health-assistant-chat > div {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            border-radius: 10px !important;
          }
          .bpw-widget-btn,
          .bpw-floating-button,
          .bpw-widget-button,
          .bpw-float-bubble,
          button[type="button"].bpw-widget-btn {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          .bpw-layout {
            border: none !important;
            border-radius: 10px !important;
            width: 100% !important;
            height: 100% !important;
          }
          .bpw-header {
            border-top-left-radius: 10px !important;
            border-top-right-radius: 10px !important;
          }
          .bpw-chat-container {
            height: calc(100% - 52px) !important;
          }
          .bpw-composer {
            border-bottom-left-radius: 10px !important;
            border-bottom-right-radius: 10px !important;
          }
        `}
      </style>
    </div>
  );
};

export default HealthAssistant;
