import java.util.Optional;
import java.util.UUID;

public record abn(Optional<UUID> b) implements aay<abg> {
   public static final aao<wx, abn> a = aay.a(abn::a, abn::new);

   private abn(wx $$0) {
      this($$0.b((aap)jx.g));
   }

   public abn(Optional<UUID> param1) {
      this.b = $$0;
   }

   private void a(wx $$0) {
      $$0.a((Optional)this.b, (aaq)jx.g);
   }

   public aba<abn> a() {
      return abu.g;
   }

   public void a(abg $$0) {
      $$0.a(this);
   }

   public Optional<UUID> b() {
      return this.b;
   }
}
