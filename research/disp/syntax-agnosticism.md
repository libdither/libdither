# Syntax Agnosticism

Syntax is one of the most visible barriers separating different languages from each other. It is easy to distinguish between Lisp and C, BASIC and APL, Haskell and Fortran. All these languages can pretty much do the same things, but their different syntax plays a big role in preventing programmers experienced in one from trying out another.

Disp aims to solve this issue by allowing the programmer to use whatever syntax style they prefer. This is possible because Disp is not stored in text files, it is instead temporarily rendered to a text file in a given syntax style and then parsed back to a structured binary format. Syntax styles should be compatible with each other and switching between them should be as simple as a click of a button.