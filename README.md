# TripLog

### Want to try this out? Visit [triplog.xyz](http://www.triplog.xyz/)

## Progress I've Made This Week:
[Here's the repo for the Triplog Flask app](https://github.com/AcidicNic/triplog_web) I worked on before this intensive. This version is still deployed [here](https://triplog-nic.herokuapp.com/) for comparison

* This application is now entirely written in Express.
* There is now authentication, so logs are private.
* I got a domain, deployed this Express app to Heroku, and set the database up on MongoDB Atlas. (Heroku is dropping the mLab add-on soon.)
* The 'New Log' form on /begin has been revamped!
    * Specifically the add dose section, looks better and uses JS to add/delete HTML instead of already having a bunch of add dose boxes on the form that just get hidden or revealed with CSS when the -/+ buttons are pressed.

### What can I do with this?
* Create an account to keep your logs private.

* When making a new log, the drug textbox will suggest drug names. Using any of the suggested names means that TripLog can pull tons of information from the tripsit.me API and put it all into info cards. You can access the info cards by opening the drawer on the top left and clicking on the name of a drug.

* There is a text box at the bottom of the page that you can use to add timestamped notes about your experience.

* You can ask drug related questions to the AskTheCaterpillar API right in your note text box! Start your note with ???, like this "??? your question here" and a new note will appear on the screen with the answer to your question.

* If you're not feeling too hot and you need someone to talk to, open up the drawer on the top left and click the red "Help" button. This will link you to the tripsit.me assistance RCS chat, it's full of nice people that will try their best to help you out.

* After adding a note, you can click on it to add timestamped edits!
