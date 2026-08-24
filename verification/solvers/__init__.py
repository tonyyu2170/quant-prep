from .bayes import SOLVERS as _bayes
from .counting import SOLVERS as _counting
from .ev_variance import SOLVERS as _ev_variance
from .distributions import SOLVERS as _distributions
from .ruin import SOLVERS as _ruin
from .geometric import SOLVERS as _geometric
from .markov import SOLVERS as _markov
from .symmetry import SOLVERS as _symmetry
from .brainteasers import SOLVERS as _brainteasers
from .statistics import SOLVERS as _statistics
from .finance import SOLVERS as _finance
from .stochastic import SOLVERS as _stochastic
from .linear_algebra import SOLVERS as _linear_algebra

SOLVERS = {**_bayes, **_counting, **_ev_variance, **_distributions, **_ruin, **_geometric, **_markov, **_symmetry, **_brainteasers, **_statistics, **_finance, **_stochastic, **_linear_algebra}
