from .bayes import SOLVERS as _bayes
from .counting import SOLVERS as _counting

SOLVERS = {**_bayes, **_counting}
