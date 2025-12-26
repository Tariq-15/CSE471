import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { User, Shield, Bell, Palette, Camera, Key, History } from "lucide-react";

export function UserSettings() {
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    stockAlerts: true,
    customerMessages: false,
    systemUpdates: true,
    emailNotifications: true,
    pushNotifications: false
  });

  const [accessibility, setAccessibility] = useState({
    darkMode: false,
    fontSize: "medium",
    reducedMotion: false
  });

  const loginHistory = [
    { date: "2024-09-23", time: "10:30 AM", device: "Chrome on Windows", location: "New York, NY" },
    { date: "2024-09-22", time: "09:15 AM", device: "Chrome on Windows", location: "New York, NY" },
    { date: "2024-09-21", time: "11:45 AM", device: "Safari on iPhone", location: "New York, NY" },
    { date: "2024-09-20", time: "08:30 AM", device: "Chrome on Windows", location: "New York, NY" },
    { date: "2024-09-19", time: "02:15 PM", device: "Chrome on Windows", location: "New York, NY" }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-black">User Settings</h2>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="/api/placeholder/96/96" alt="Admin" />
                    <AvatarFallback className="bg-[#576D64] text-white text-2xl">
                      A
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-[#576D64] hover:bg-[#465A52]"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-black">Administrator</h3>
                  <p className="text-gray-600">admin@unleashed.com</p>
                  <p className="text-sm text-gray-500">Last updated: September 15, 2024</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" defaultValue="Administrator" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue="admin" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="admin@unleashed.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-black">Change Password</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="bg-[#576D64] hover:bg-[#465A52]">
                  Save Changes
                </Button>
                <Button variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium text-black">System Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Order Updates</Label>
                      <p className="text-sm text-gray-600">Get notified when orders are placed or updated</p>
                    </div>
                    <Switch
                      checked={notifications.orderUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, orderUpdates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Stock Alerts</Label>
                      <p className="text-sm text-gray-600">Low stock and out of stock notifications</p>
                    </div>
                    <Switch
                      checked={notifications.stockAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, stockAlerts: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Customer Messages</Label>
                      <p className="text-sm text-gray-600">Support requests and customer inquiries</p>
                    </div>
                    <Switch
                      checked={notifications.customerMessages}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, customerMessages: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">System Updates</Label>
                      <p className="text-sm text-gray-600">Platform updates and maintenance notices</p>
                    </div>
                    <Switch
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, systemUpdates: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-black">Delivery Methods</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-gray-600">Browser push notifications</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, pushNotifications: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-[#576D64] hover:bg-[#465A52]">
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Accessibility Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Dark Mode</Label>
                    <p className="text-sm text-gray-600">Switch to dark theme</p>
                  </div>
                  <Switch
                    checked={accessibility.darkMode}
                    onCheckedChange={(checked) =>
                      setAccessibility({ ...accessibility, darkMode: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Reduced Motion</Label>
                    <p className="text-sm text-gray-600">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    checked={accessibility.reducedMotion}
                    onCheckedChange={(checked) =>
                      setAccessibility({ ...accessibility, reducedMotion: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Font Size</Label>
                  <p className="text-sm text-gray-600 mb-3">Adjust text size for better readability</p>
                  <div className="flex gap-2">
                    <Button 
                      variant={accessibility.fontSize === "small" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAccessibility({ ...accessibility, fontSize: "small" })}
                    >
                      Small
                    </Button>
                    <Button 
                      variant={accessibility.fontSize === "medium" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAccessibility({ ...accessibility, fontSize: "medium" })}
                    >
                      Medium
                    </Button>
                    <Button 
                      variant={accessibility.fontSize === "large" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAccessibility({ ...accessibility, fontSize: "large" })}
                    >
                      Large
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="bg-[#576D64] hover:bg-[#465A52]">
                Save Accessibility Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-[#576D64]" />
                    <div>
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable 2FA
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#576D64]" />
                  <h4 className="font-medium text-black">Login History</h4>
                </div>
                <div className="space-y-3">
                  {loginHistory.map((login, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-black">{login.device}</p>
                        <p className="text-sm text-gray-600">{login.location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-black">{login.date}</p>
                        <p className="text-sm text-gray-600">{login.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                  Sign Out All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}