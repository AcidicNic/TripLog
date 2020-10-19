# TripLog
**Want to try this out? Visit [triplog.xyz](http://www.triplog.xyz/)**

----

### Intensive Info:
Here's the [repo for the Triplog Flask app](https://github.com/AcidicNic/triplog_web) I worked on before this intensive. The Flask version is still deployed [here](https://triplog-nic.herokuapp.com/) for comparison.

### Progress I've Made This Week:
* This application is now entirely written in Express. 🎉
* Made improvements to the way data is structured in the DB.
* Fixed a couple bugs.
* There is now authentication, so logs are private.
* I got a domain, deployed this Express app to Heroku, and set the database up on MongoDB Atlas. (Heroku is dropping the mLab add-on next month!)
* The 'New Log' form on /begin has been revamped!
    * Specifically the add dose section, looks better and uses JS to add/delete HTML instead of already having a bunch of add dose boxes on the form that just get hidden or revealed with CSS when the -/+ buttons are pressed.

---

### What can I do with this?
* Create an account to keep your logs private.

* When making a new log, the drug textbox will suggest drug names. Using any of the suggested names means that TripLog can pull tons of information from the tripsit.me API and put it all into info cards. You can access the info cards by opening the drawer on the top left and clicking on the name of a drug.
    * __*Now that I switched over to Express, I still need to add the info cards! This will happen soon.*__

* There is a text box at the bottom of the page that you can use to add timestamped notes about your experience.

* After adding a note, you can click on it to add timestamped edits!

* Click on the top left to open the drawer:
    * Click 'Add Dose' to add a dose.
    * Click on your description to edit the log's title & description.
    * Click 'Home' to go back.

* You can ask drug related questions to the AskTheCaterpillar API right in your note text box! Start your note with ???, like this "??? your question here" and a new note will appear on the screen with the answer to your question.
    * __*Sadly, [AskTheCaterpillar is not working anymore](https://github.com/estiens/caterpillar_rails/issues/25). :( I'll add this feature back in as soon as the API is up and running again!*__

* If you're not feeling too hot and you need someone to talk to, open up the drawer on the top left and click the red "Help" button. This will link you to the tripsit.me assistance RCS chat, it's full of nice people that will try their best to help you out.


### What's coming next?
* Refresh timestamps (x minutes ago) automatically every minute.
* Drug info cards.
* Warnings if a user enters a dangerous combo.
* Email verification and password reset via mailgun.
* Options Page
    * Will include: change name, change password, and delete account. As well as some small options like timestamp format, .
* Changes to Archive page
    * Filter options, search, select many and delete, export as timestamped text in trip report format (like T+00:00 - <note text here>)
* Add more resources to the help button from [this resource list](https://medium.com/@nicole_rocha_abadie/drug-harm-reduction-work-in-progress-a03efcf56493) I've made.
* Add chatbot like features similar to how I integrated the AskTheCaterpillar chatbot.
    * Ex. You type "!info drug_name" into the add note box at the bottom of the /logs/:logId page. It returns a factsheet.

### Can I help?
Yes! Feel free to put in a pull request or create an issue if you've got ideas.
