export const config = {
    app: {
        backend_url: () => import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
        backend_linkedin__url: () => import.meta.env.VITE_BACKEND_LINKEDIN_URL
    },
    socketMethods: {
        messageFromServer: "message-from-server",
        messageFromClient: "message-from-client",
        onlineUsers: "online-users",
        enterRoom: "enter-room",
    },
    resources: {
        imageMaxSize: () => 10 * 1024 * 1024 // Max file size: 10MB
    },
    localStorageKeys: {
        userAuth: "userAuth"
    }
}