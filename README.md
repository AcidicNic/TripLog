# TripLog
**Want to try this out? Visit [triplog.xyz](http://www.triplog.xyz/)**

**DISCLAIMER:** This is only live for testing purposes. There will be bugs, the database may be wiped clean at any moment if I have to make any major changes to a model.

*If you find a bug create an issue on this repo, or email me at nic4096@gmail.com*

### What can I do with this?
* Create an account to keep your logs private.

* When making a new log, the drug textbox will suggest drug names. Using any of the suggested names means that TripLog can pull tons of information from the tripsit.me API and put it all into info cards. You can access the info cards by opening the drawer on the top left and clicking on the name of a drug.

* There is a text box at the bottom of the page that you can use to add timestamped notes about your experience.

* After adding a note, you can click on it to add timestamped edits!

* Click on the top left to open the drawer:
    * Click 'Add Dose' to add a dose.
    * Click on your description to edit the log's title & description.
    * Click 'Home' to go back.
    * Click on a dose to pull up an info card.

* You can ask drug related questions to the AskTheCaterpillar API right in your note text box! Start your note with ???, like this "??? your question here" and a new note will appear on the screen with the answer to your question.
    * __*Sadly, [AskTheCaterpillar is not working anymore](https://github.com/estiens/caterpillar_rails/issues/25). :( I'll add this feature back in as soon as the API is up and running again!*__

* If you're not feeling too hot and you need someone to talk to, open up the drawer on the top left and click the red "Help" button. This will link you to the tripsit.me assistance RCS chat, it's full of nice people that will try their best to help you out.


### What's coming next?
* [x] Email verification.
* [ ] Password reset.
* [ ] Add more links to the help modal from [this harm reduction resource list](https://medium.com/@nicole_rocha_abadie/drug-harm-reduction-work-in-progress-a03efcf56493) I put together.
* [ ] Warnings if a user enters a dangerous combo.
* [ ] Options Page
    * Will include: change name, change password, and delete account. As well as some small options like timestamp format.
* [ ] Changes to Archive page
    * Filter options, search, select many and delete, export as timestamped text in trip report format (like T+00:00 - note text here)
* [ ] Add chatbot like features similar to how I integrated the AskTheCaterpillar chatbot.
    * Ex. You type "!info drug_name" into the add note box at the bottom of the /logs/:logId page. It returns a factsheet.


### Can I help?
Yes! Feel free to put in a pull request or create an issue if you've got ideas.
