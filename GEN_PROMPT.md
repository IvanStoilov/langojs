# LangoJS

I want to build translations tool package that is responsible for managing translation strings in a javascript repository. I want it to store all translations in a single json file as a DB. I want to be able to translate each string in multiple languages. Those translations can then be distributed in the required folders, so that they can be imported by the translation library used in the repository.

# Use cases

- There should be 1 configuration file (_.ts or _.js) that should export some configurations. Here is a sample:

```
export default const config = {
    masterLanguage: "en",
    availableLanguages: ["en", "es", "fr", "de"],
    aiModel: 'gpt-5.2',
    getGroup: key => key.split("_")[0],
    sets: [
        {
            destination: "./app/src/translations",
            groups: ["app", "common"]
        },
        {
            destination: "./store/src/translations",
            groups: ["store", "common"]
        },
    ]
}
```

- There is 1 master language (usually english) (as a setting `masterLanguage` in the config file)
- There are multiple languages that each string is translated into (including the master language) - that's the setting `availableLanguages` in the config file
- The package expects that to use a translation in code a t function is used: `{{t("site_title", "{{page}} | My Business", { page: 'Home' })}}` where the first argument is the string, the second is the default value, the third is a dictionary of parameters that get replaced in the translation value.
- There should be a functionality to extract all translations from all .ts & .js files (excluding node_modules) recurrsively from the root folder and put them in the database with the default value stored as the value for the master language. This should be available in the GUI as a simple button. If there are translations in the db already, then the new translations should be merged with the existing without overriding any existing translations.
- There should be a simple GUI which shows all translations and their status - green if translated in all languages, yellow if missing translations in at least 1 language, red if only translated in the master language
- The GUI should allow for translations in each language and for each string to be modified and stored in the json db file.
- The GUI should allow for all yellow and red translations to be automatically translated using vercel's ai library with a model defined as a configuration. This would populate all missing translations with AI translations with the master langauge used as a base.
- The GUI should show all translations in a table with the red first, then yellow, then green. There should be a search box for searching which searches in strings and translations.
- Each translations bellongs to a group (or a namespace) which is defined via a `getGroup` function which receives the translation string as a parameter and returns the group id.
- In the json db there should be a special setting - sets which is an array of objects each of which consist of: destination (the output folder) and groups (string array of group IDs). There should be a single button in the GUI that generates all sets and outputs them in their corresponding destination folders. To generate a set just create 1 json file for each of the available languages and in that json file put all the translations for the groups that belong to that set. The structure of the json file should be: `{ key: translationValue }` where the key is the translation string and the value is the translation in that language.
- The app should be a used as an npm package that can be installed via npm in a repository and works out of the box with a simple configuration file. The package should also export a CLI command that can be used to open the GUI and manage translations.

Suggest what tech stack to use. I personally prefer React (maybe we can use Preact because it is lighter) + a tiny express server for fetching db, storing db, extracting translations, and generating the sets? I
prefer using tailwind for CSS.

Very important!!! Make sure to always use the latest versions of all packages. install them manually 1-by-1 using `yarn install <package>` instead of generating the package.json file and then running `yarn
install`.
