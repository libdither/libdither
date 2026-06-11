# Live Rollbacks

While disp is a compiled language, it is also a purely functional language which means that changes to state can be saved in an efficient manner and rolled back when necessary.

This means that a user can change the code of the program and while the program is running, updates parts of the running process's code and roll back the program to the state before the process ran the code.