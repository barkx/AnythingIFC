"""IFCWise local tools: list, pull, prepare, validate (PLAN.md §8)."""

import os
from pathlib import Path

import typer

from ifc_tools import __version__
from ifc_tools.api import AdminApi, ApiError
from ifc_tools.config import load_settings
from ifc_tools.prepare import prepare as prepare_job
from ifc_tools.pull import pull as pull_job
from ifc_tools.validate import validate as validate_job

app = typer.Typer(help="Prepare IFCWise job folders and validate IFC output.", no_args_is_help=True)


def _api() -> AdminApi:
    settings = load_settings()
    if not settings.admin_token:
        typer.echo(
            "IFCWISE_ADMIN_TOKEN is not set (tools/ifc-tools/.env or environment).", err=True
        )
        raise typer.Exit(2)
    return AdminApi(settings.app_url, settings.admin_token)


def _job_dir(job: str) -> Path:
    """Accept a project id (looked up in IFCWISE_DATA_DIR/jobs) or a path to a job folder."""
    path = Path(job)
    if path.is_dir():
        return path
    candidate = load_settings().jobs_dir / job
    if not candidate.is_dir():
        typer.echo(f"No job folder for '{job}' - run `ifc-tools pull {job}` first.", err=True)
        raise typer.Exit(2)
    return candidate


@app.command("list")
def list_projects(
    all_: bool = typer.Option(
        False, "--all", help="Include completed, rejected and draft projects."
    ),
) -> None:
    """Projects waiting for work (submitted, in progress, needs info)."""
    try:
        projects = _api().list_projects()
    except ApiError as error:
        typer.echo(str(error), err=True)
        raise typer.Exit(1)
    active = {"submitted", "in_progress", "needs_info"}
    shown = [p for p in projects if all_ or p["status"] in active]
    if not shown:
        typer.echo("Nothing waiting.")
        return
    for p in sorted(shown, key=lambda p: p["createdAt"]):
        flag = "public" if p["published"] else "review"
        typer.echo(
            f"{p['id']}  {p['status']:<11} {flag:<6} {p['inputs']:>2} in  {p['createdAt'][:10]}  {p['title']}"
        )


@app.command()
def pull(
    project_id: str, force: bool = typer.Option(False, help="Re-download files that already exist.")
) -> None:
    """Download a project's inputs into IFCWISE_DATA_DIR/jobs/<id>/ and run prepare."""
    settings = load_settings()
    try:
        job_dir, downloaded = pull_job(_api(), settings.jobs_dir, project_id, force=force)
    except (ApiError, ValueError) as error:
        typer.echo(str(error), err=True)
        raise typer.Exit(1)
    typer.echo(f"{job_dir}  ({len(downloaded)} file(s) downloaded)")
    _print_prepare(job_dir)
    if os.name == "nt":
        typer.echo(f'Open it:  explorer "{job_dir}"')


def _print_prepare(job_dir: Path) -> None:
    report = prepare_job(job_dir)
    for line in report.geometry + report.pages:
        typer.echo(f"  prepared  {line}")
    for name in report.texts:
        typer.echo(f"  text      input/{name} (included in PROMPT.md)")
    for note in report.notes:
        typer.echo(f"  note      {note}")
    typer.echo(f"  prompt    {job_dir / 'PROMPT.md'}")


@app.command()
def prepare(job: str) -> None:
    """Extract DXF/PDF data into prepared/ and render PROMPT.md. JOB is a project id or folder."""
    try:
        _print_prepare(_job_dir(job))
    except FileNotFoundError as error:
        typer.echo(str(error), err=True)
        raise typer.Exit(1)


@app.command()
def validate(job: str) -> None:
    """Check output/model.ifc and write output/summary.json. Exits 1 on errors."""
    try:
        result = validate_job(_job_dir(job))
    except FileNotFoundError as error:
        typer.echo(str(error), err=True)
        raise typer.Exit(1)
    typer.echo(f"{result.ifc_path}")
    counts = result.summary.get("counts", {})
    if counts:
        typer.echo("  " + ", ".join(f"{k} {v}" for k, v in counts.items()))
    for warning in result.warnings:
        typer.echo(f"  warning  {warning}")
    for error in result.errors:
        typer.echo(f"  ERROR    {error}", err=True)
    if not result.ok:
        raise typer.Exit(1)
    typer.echo("  OK - upload output/ files on the admin page.")


@app.command()
def version() -> None:
    """Print the version."""
    typer.echo(__version__)
