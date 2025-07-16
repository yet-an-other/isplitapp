import UIKit
import FirebaseCore
import FirebaseMessaging


@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window : UIWindow?
    
    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        UNUserNotificationCenter.current().delegate = self
        application.registerForRemoteNotifications()
        return true
    }
    
    
    // [END receive_message]
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Unable to register for remote notifications: \(error.localizedDescription)")
    }
    
    // This function is added here only for debugging purposes, and can be removed if swizzling is enabled.
    // If swizzling is disabled then this function must be implemented so that the APNs token can be paired to
    // the FCM registration token.
//    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
//        print("APNs token retrieved: \(deviceToken)")
//
//        // With swizzling disabled you must set the APNs token here.
//        Messaging.messaging().apnsToken = deviceToken
//    }
}

// Message handling
//
extension AppDelegate : UNUserNotificationCenterDelegate {
    
    // if notification arrived in open app, do nothing
    //
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        
        completionHandler([.banner, .list, .sound])
    }
    
    // If notification was pressed, need to open app on the group expense page
    //
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        
        let userInfo = response.notification.request.content.userInfo
        
        let partyId = userInfo["partyId"] as! String
        if (partyId != ""){
            openPath(urlPath: "/\(partyId)/expenses")
        }
                
        completionHandler()
    }
}


extension AppDelegate : MessagingDelegate {
    
    // On startup or refresh token
    //
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token received: \(String(describing: fcmToken))")
        
        //let dataDict:[String: String] = ["token": fcmToken ?? ""]
        //NotificationCenter.default.post(name: Notification.Name("FCMToken"), object: nil, userInfo: dataDict)
      
        // push token to react app
        //
        pushActualFcmToken()
    }
}
