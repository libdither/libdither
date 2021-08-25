# Application Design Philosophy

Application APIs should be future-proofed as much as possible

Application GUIs should be generally be as cross platform as possible.

There should be different modes of use for different user skill levels to try and accomidate as many people as possible.
 - These modes should enable/disable various aspects of *configurability* in the application
 - **Simple** mode should be super easy to use for anyone and come with a quick tutorial
   - Configuration options should be assumed as much as possible, 
 - **Default** mode should come with a tutorial and explain how modes work and how to change them
 - **Advanced** mode assumes the user already knows how to use the app or can figure it out on their own. All configurability functionality should be enabled.
   - Application developers should strive to implement as much configurability as possible into every aspect of their application for complex users.
   - For desktop applications, configuration on a small level (for specific contextual buttons or features) could be shown through right-click menus.
   - For mobile applications these configuration items can be shown through a long-press.