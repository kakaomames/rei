import java.util.Objects;
import java.util.function.ToIntFunction;
import org.jspecify.annotations.Nullable;

public class ago implements aay<adb> {
   public static final aao<wx, ago> a = aay.a(ago::a, ago::new);
   private final fui b;
   private final String c;

   public ago(fui $$0, @Nullable fuj $$1) {
      this.b = $$0;
      if ($$1 == null) {
         this.c = "";
      } else {
         this.c = $$1.c();
      }

   }

   private ago(wx $$0) {
      this.b = (fui)$$0.a(fui.u);
      this.c = $$0.p();
   }

   private void a(wx $$0) {
      $$0.a((ToIntFunction)(fui::a), (Object)this.b);
      $$0.a(this.c);
   }

   public aba<ago> a() {
      return ahz.aJ;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public fui b() {
      return this.b;
   }

   @Nullable
   public String e() {
      return Objects.equals(this.c, "") ? null : this.c;
   }
}
