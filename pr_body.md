Can you analyse the entire code base and read task_crrate_tests.md. Please go through the code base extremely focussed judging each file one by one. Than look if the task has been executed succesfully.

Fix any errors that you find or change anything that you believe that should have been done in the first place.

A few things to look out for:
- we don't want test placeholders. Tests should be about functionality and features that are already here. 
- if there is a failing tests because the feature is not there yet. Remove the test. 
- if the test is failing because something is wrong. Fix it.
- alle type checks must pass, also apps/web. Run this via pnpm -r run type-check
- all eslint must pass. Run pnpm -r run lint:fix. To auto fix. And then solve any errors that are left.

The test suite must ben complete. It just match the current project. It should never contain placeholders or "to be created features"