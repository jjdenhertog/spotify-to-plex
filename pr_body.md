Currently the task_creare_test still contains reference to mqtt. Make sure it is removed and that it is clear that no test should be created for it.

The samen goes for sync-worker. It should not have any tests. And it should be clear in the document that none should be created for it