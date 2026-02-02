import java.time.Instant;
import org.jspecify.annotations.Nullable;

public class al {
   @Nullable
   private Instant a;

   public al() {
   }

   public al(Instant $$0) {
      this.a = $$0;
   }

   public boolean a() {
      return this.a != null;
   }

   public void b() {
      this.a = Instant.now();
   }

   public void c() {
      this.a = null;
   }

   @Nullable
   public Instant d() {
      return this.a;
   }

   public String toString() {
      Object var10000 = this.a == null ? "false" : this.a;
      return "CriterionProgress{obtained=" + String.valueOf(var10000) + "}";
   }

   public void a(wx $$0) {
      $$0.a((Object)this.a, (aaq)(wx::a));
   }

   public static al b(wx $$0) {
      al $$1 = new al();
      $$1.a = (Instant)$$0.c(wx::s);
      return $$1;
   }
}
