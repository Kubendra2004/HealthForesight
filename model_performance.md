# Model Performance and Validation Status

## Clinical prediction models

The repository contains heart disease and diabetes prediction models, but there is not enough reproducible evaluation evidence to report their scores as meaningful clinical performance. Previously listed percentages and confidence claims have been removed because they were not tied to a documented, independent validation protocol.

The diabetes training script now keeps all gender groups present in its source dataset and prints a stratified holdout report, per-gender holdout reports, and five-fold cross-validated balanced accuracy. These are development checks only. The checked-in model artifact has not been retrained by this change; its saved gender encoder determines which genders it can accept. The API rejects inputs outside that encoder's supported categories with an explanatory error.

The checks in the training script do not establish clinical validity. Before clinical use, each model needs a versioned dataset and artifact, an independent representative test set, subgroup sample counts and metrics, calibration and uncertainty assessment, and review by qualified clinical and statistical reviewers. Predictions are informational and must not be used alone to diagnose or treat a patient.

## Resource forecasts and clustering

The repository includes resource forecasting and patient clustering code. No validated performance figures are reported here: the available figures were not accompanied by enough versioned data, evaluation outputs, or reproducible protocols to verify them. Forecasts and cluster labels are operational or exploratory outputs, not clinical evidence.

## Analytics availability

Treatment success and readmission outcomes are not currently collected, so the treatment-success endpoint reports that the metric is unavailable. Resource utilization and cost summaries use recorded bed snapshots, oxygen inventory, and bill amounts; historical consumption, department allocation, and item category breakdowns are not available in the current data model.
