import java.util.Collection;
import java.util.List;
import java.util.UUID;

public record afm(List<UUID> b) implements aay<adb> {
   public static final aao<wx, afm> a = aay.a(afm::a, afm::new);

   private afm(wx $$0) {
      this($$0.a((aap)jx.g));
   }

   public afm(List<UUID> param1) {
      this.b = $$0;
   }

   private void a(wx $$0) {
      $$0.a((Collection)this.b, (aaq)jx.g);
   }

   public aba<afm> a() {
      return ahz.ak;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public List<UUID> b() {
      return this.b;
   }
}
