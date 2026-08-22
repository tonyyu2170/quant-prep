from .bayes import SOLVERS as _bayes
from .counting import SOLVERS as _counting
from .ev_variance import SOLVERS as _ev_variance
from .distributions import SOLVERS as _distributions
from .ruin import SOLVERS as _ruin
from .geometric import SOLVERS as _geometric

SOLVERS = {**_bayes, **_counting, **_ev_variance, **_distributions, **_ruin, **_geometric}
